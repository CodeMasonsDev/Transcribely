from app.core.config import Settings
from app.schemas.tickets import EngineeringTicket
from app.services.clickup import (
    build_clickup_task_payload,
    create_acceptance_criteria_checklist,
    format_clickup_description,
    format_clickup_task_name,
    publish_clickup_tasks,
)


def build_ticket() -> EngineeringTicket:
    return EngineeringTicket(
        id="AI-101",
        title="Create transcript intake task",
        priority="High",
        description="Accept pasted transcript text and validate empty input.",
        acceptance_criteria=[
            "The task accepts pasted transcript text.",
            "The task rejects empty transcript text.",
        ],
    )


def test_format_clickup_description_includes_ticket_fields() -> None:
    ticket = build_ticket()
    description = format_clickup_description(ticket)

    assert description == ticket.description
    assert "AI-101" not in description
    assert ticket.title not in description
    assert "Description:" not in description
    assert "Source ticket:" not in description
    assert "Priority: High" not in description
    assert "Checklists" not in description
    assert "Acceptance criteria:" not in description
    assert "- [ ] The task accepts pasted transcript text." not in description


def test_format_clickup_task_name_includes_local_ticket_id() -> None:
    assert format_clickup_task_name(build_ticket()) == (
        "AI-101 Create transcript intake task"
    )


def test_build_clickup_task_payload_maps_clickup_fields() -> None:
    settings = Settings(
        AI_API_KEY="",
        CLICKUP_DEFAULT_STATUS="backlog",
        CLICKUP_DEFAULT_TAGS="ai-generated,reviewed",
    )

    payload = build_clickup_task_payload(build_ticket(), settings)

    assert payload["name"] == "AI-101 Create transcript intake task"
    assert payload["priority"] == 2
    assert payload["status"] == "backlog"
    assert payload["tags"] == ["ai-generated", "reviewed"]
    assert "Acceptance criteria:" not in payload["description"]


def test_create_acceptance_criteria_checklist_creates_native_items(monkeypatch) -> None:
    calls = []

    def fake_post(path: str, payload: dict, settings: Settings, context: str) -> dict:
        calls.append({"path": path, "payload": payload, "context": context})
        if path.endswith("/checklist"):
            return {"id": "checklist-1"}
        return {"id": f"item-{len(calls)}"}

    monkeypatch.setattr("app.services.clickup._post_clickup_json", fake_post)

    count = create_acceptance_criteria_checklist(
        task_id="task-1",
        ticket=build_ticket(),
        settings=Settings(AI_API_KEY="", CLICKUP_API_TOKEN="token"),
    )

    assert count == 2
    assert calls[0]["path"] == "/task/task-1/checklist"
    assert calls[0]["payload"] == {"name": "Acceptance criteria"}
    assert calls[1]["path"] == "/checklist/checklist-1/checklist_item"
    assert calls[1]["payload"] == {"name": "The task accepts pasted transcript text."}
    assert calls[2]["payload"] == {"name": "The task rejects empty transcript text."}


def test_publish_clickup_tasks_preserves_task_when_checklist_fails(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.clickup.get_settings",
        lambda: Settings(
            AI_API_KEY="",
            CLICKUP_API_TOKEN="token",
            CLICKUP_LIST_ID="list-1",
        ),
    )

    def fake_create_task(ticket: EngineeringTicket, settings: Settings):
        from app.schemas.clickup import PublishedClickUpTask

        return PublishedClickUpTask(
            local_ticket_id=ticket.id,
            clickup_task_id="task-1",
            name=ticket.title,
            url="https://app.clickup.com/t/task-1",
            status="to do",
        )

    def fake_create_checklist(task_id, ticket, settings):
        raise RuntimeError("checklist failed")

    monkeypatch.setattr("app.services.clickup.create_clickup_task", fake_create_task)
    monkeypatch.setattr(
        "app.services.clickup.create_acceptance_criteria_checklist",
        fake_create_checklist,
    )

    response = publish_clickup_tasks([build_ticket()])

    assert len(response.created) == 1
    assert response.created[0].url == "https://app.clickup.com/t/task-1"
    assert response.created[0].checklist_created is False
    assert response.created[0].warning == "checklist failed"
    assert response.failed == []
