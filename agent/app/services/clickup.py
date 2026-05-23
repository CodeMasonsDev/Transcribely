import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import Settings, get_settings
from app.schemas.clickup import (
    FailedClickUpTask,
    PublishedClickUpTask,
    PublishTicketsResponse,
)
from app.schemas.tickets import EngineeringTicket

CLICKUP_API_BASE = "https://api.clickup.com/api/v2"
PRIORITY_MAP = {
    "High": 2,
    "Medium": 3,
    "Low": 4,
}


def format_clickup_description(ticket: EngineeringTicket) -> str:
    return ticket.description


def format_clickup_task_name(ticket: EngineeringTicket) -> str:
    return f"{ticket.id} {ticket.title}"


def build_clickup_task_payload(
    ticket: EngineeringTicket,
    settings: Settings | None = None,
) -> dict:
    active_settings = settings or get_settings()
    payload = {
        "name": format_clickup_task_name(ticket),
        "description": format_clickup_description(ticket),
        "priority": PRIORITY_MAP[ticket.priority],
        "status": active_settings.clickup_default_status,
    }

    if active_settings.clickup_tags:
        payload["tags"] = active_settings.clickup_tags

    return payload


def create_clickup_task(
    ticket: EngineeringTicket,
    settings: Settings | None = None,
) -> PublishedClickUpTask:
    active_settings = settings or get_settings()
    _require_clickup_config(active_settings)

    payload = build_clickup_task_payload(ticket, active_settings)
    response_data = _post_clickup_json(
        path=f"/list/{active_settings.clickup_list_id}/task",
        payload=payload,
        settings=active_settings,
        context=f"create task for {ticket.id}",
    )

    task_id = str(response_data.get("id") or "")
    if not task_id:
        raise RuntimeError(f"ClickUp response did not include a task id for {ticket.id}")

    task_url = str(response_data.get("url") or f"https://app.clickup.com/t/{task_id}")

    response_status = response_data.get("status")
    if isinstance(response_status, dict):
        status = str(response_status.get("status") or payload["status"])
    else:
        status = str(response_status or payload["status"])

    return PublishedClickUpTask(
        local_ticket_id=ticket.id,
        clickup_task_id=task_id,
        name=str(response_data.get("name") or format_clickup_task_name(ticket)),
        url=task_url,
        status=status,
    )


def create_clickup_checklist(
    task_id: str,
    name: str = "Acceptance criteria",
    settings: Settings | None = None,
) -> str:
    active_settings = settings or get_settings()
    response_data = _post_clickup_json(
        path=f"/task/{task_id}/checklist",
        payload={"name": name},
        settings=active_settings,
        context=f"create checklist for ClickUp task {task_id}",
    )
    checklist_id = _extract_clickup_id(response_data, "checklist")
    if not checklist_id:
        checklist_id = _extract_checklist_id_by_name(response_data, name)
    if not checklist_id:
        raise RuntimeError(
            f"ClickUp response did not include a checklist id for task {task_id}"
        )

    return checklist_id


def create_clickup_checklist_item(
    checklist_id: str,
    criterion: str,
    settings: Settings | None = None,
) -> str:
    active_settings = settings or get_settings()
    response_data = _post_clickup_json(
        path=f"/checklist/{checklist_id}/checklist_item",
        payload={"name": criterion},
        settings=active_settings,
        context=f"create checklist item for checklist {checklist_id}",
    )

    item_id = _extract_clickup_id(response_data, "checklist_item")
    return item_id


def create_acceptance_criteria_checklist(
    task_id: str,
    ticket: EngineeringTicket,
    settings: Settings | None = None,
) -> int:
    active_settings = settings or get_settings()
    checklist_id = create_clickup_checklist(task_id, settings=active_settings)

    created_count = 0
    for criterion in ticket.acceptance_criteria:
        create_clickup_checklist_item(
            checklist_id=checklist_id,
            criterion=criterion,
            settings=active_settings,
        )
        created_count += 1

    return created_count


def publish_clickup_tasks(tickets: list[EngineeringTicket]) -> PublishTicketsResponse:
    settings = get_settings()
    _require_clickup_config(settings)

    created: list[PublishedClickUpTask] = []
    failed: list[FailedClickUpTask] = []

    for ticket in tickets:
        try:
            task = create_clickup_task(ticket, settings)
            try:
                task.checklist_item_count = create_acceptance_criteria_checklist(
                    task_id=task.clickup_task_id,
                    ticket=ticket,
                    settings=settings,
                )
                task.checklist_created = True
            except RuntimeError as exc:
                task.warning = str(exc)

            created.append(task)
        except RuntimeError as exc:
            failed.append(
                FailedClickUpTask(
                    local_ticket_id=ticket.id,
                    title=ticket.title,
                    error=str(exc),
                )
            )

    return PublishTicketsResponse(created=created, failed=failed)


def test_clickup_connection(settings: Settings | None = None) -> str:
    active_settings = settings or get_settings()
    _require_clickup_config(active_settings)
    response_data = _get_clickup_json(
        path=f"/list/{active_settings.clickup_list_id}",
        settings=active_settings,
        context="verify ClickUp list connection",
    )
    list_name = str(response_data.get("name") or active_settings.clickup_list_id)
    return list_name


def _get_clickup_json(path: str, settings: Settings, context: str) -> dict:
    request = Request(
        url=f"{CLICKUP_API_BASE}{path}",
        headers={"Authorization": settings.clickup_api_token},
        method="GET",
    )

    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"ClickUp rejected {context}: HTTP {exc.code} {body}") from exc
    except URLError as exc:
        raise RuntimeError(f"ClickUp connection failed while trying to {context}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"ClickUp returned invalid JSON while trying to {context}") from exc


def _post_clickup_json(
    path: str,
    payload: dict,
    settings: Settings,
    context: str,
) -> dict:
    request = Request(
        url=f"{CLICKUP_API_BASE}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": settings.clickup_api_token,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"ClickUp rejected {context}: HTTP {exc.code} {body}") from exc
    except URLError as exc:
        raise RuntimeError(f"ClickUp connection failed while trying to {context}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"ClickUp returned invalid JSON while trying to {context}") from exc


def _extract_clickup_id(response_data: dict, nested_key: str) -> str:
    direct_id = response_data.get("id")
    if direct_id:
        return str(direct_id)

    nested_value = response_data.get(nested_key)
    if isinstance(nested_value, dict) and nested_value.get("id"):
        return str(nested_value["id"])

    return ""


def _extract_checklist_id_by_name(response_data: dict, name: str) -> str:
    checklists = response_data.get("checklists")
    if not isinstance(checklists, list):
        return ""

    for checklist in reversed(checklists):
        if (
            isinstance(checklist, dict)
            and checklist.get("name") == name
            and checklist.get("id")
        ):
            return str(checklist["id"])

    return ""


def _require_clickup_config(settings: Settings) -> None:
    if not settings.clickup_api_token:
        raise RuntimeError("CLICKUP_API_TOKEN is required to publish tickets.")

    if not settings.clickup_list_id:
        raise RuntimeError("CLICKUP_LIST_ID is required to publish tickets.")
