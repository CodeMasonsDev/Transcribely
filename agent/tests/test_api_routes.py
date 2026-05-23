from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.clickup import PublishedClickUpTask, PublishTicketsResponse
from app.schemas.responses import (
    OrchestrationMetadata,
    OrchestrationResponse,
)
from app.schemas.tickets import EngineeringTicket


class FakeOrchestrator:
    async def run(self, transcript_input):
        return OrchestrationResponse(
            executive_summary="Summary",
            key_decisions=["Decision"],
            open_questions=["Question"],
            department_action_items=[],
            tickets=[
                build_ticket("AI-001"),
                build_ticket("AI-002"),
                build_ticket("AI-003"),
                build_ticket("AI-004"),
            ],
            metadata=OrchestrationMetadata(
                model="deepseek-v4-flash",
                ticket_count=4,
                source=transcript_input.source,
            ),
        )


def build_ticket(ticket_id: str) -> EngineeringTicket:
    return EngineeringTicket(
        id=ticket_id,
        title=f"Ticket {ticket_id}",
        priority="High",
        description="Create a ClickUp-style task for frontend review.",
        acceptance_criteria=["The API returns the expected schema."],
    )


def test_health_route() -> None:
    client = TestClient(create_app())
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["model"] == "deepseek-v4-flash"


def test_orchestrate_rejects_empty_request() -> None:
    client = TestClient(create_app())
    response = client.post("/api/v1/orchestrate")

    assert response.status_code == 400


def test_orchestrate_accepts_pasted_transcript(monkeypatch) -> None:
    from app.api import routes

    monkeypatch.setattr(routes, "build_orchestrator", lambda: FakeOrchestrator())
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/orchestrate",
        data={"transcript_text": "Strategy meeting transcript"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["source"] == "text"
    assert len(data["tickets"]) == 4
    assert set(data["tickets"][0]) == {
        "id",
        "title",
        "priority",
        "description",
        "acceptance_criteria",
    }


def test_orchestrate_accepts_txt_upload(monkeypatch) -> None:
    from app.api import routes

    monkeypatch.setattr(routes, "build_orchestrator", lambda: FakeOrchestrator())
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/orchestrate",
        files={"file": ("meeting.txt", b"Strategy meeting transcript", "text/plain")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["source"] == "file"
    assert len(data["tickets"]) == 4


def test_clickup_publish_accepts_reviewed_tickets(monkeypatch) -> None:
    from app.api import routes

    def fake_publish(tickets):
        return PublishTicketsResponse(
            created=[
                PublishedClickUpTask(
                    local_ticket_id=tickets[0].id,
                    clickup_task_id="abc123",
                    name=tickets[0].title,
                    url="https://app.clickup.com/t/abc123",
                    status="to do",
                    checklist_created=True,
                    checklist_item_count=1,
                )
            ],
            failed=[],
        )

    monkeypatch.setattr(routes, "publish_clickup_tasks", fake_publish)
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/clickup/publish",
        json={"tickets": [build_ticket("AI-001").model_dump()]},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["created"][0]["local_ticket_id"] == "AI-001"
    assert data["created"][0]["url"] == "https://app.clickup.com/t/abc123"
    assert data["created"][0]["checklist_created"] is True
    assert data["created"][0]["checklist_item_count"] == 1
    assert data["failed"] == []


def test_clickup_publish_rejects_empty_ticket_list() -> None:
    client = TestClient(create_app())
    response = client.post("/api/v1/clickup/publish", json={"tickets": []})

    assert response.status_code == 422


def test_project_management_test_connection_delegates_to_clickup(monkeypatch) -> None:
    from app.api import routes

    monkeypatch.setattr(routes, "test_clickup_connection", lambda: "Demo List")
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/project-management/test-connection",
        json={"provider": "clickup"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "clickup"
    assert data["connected"] is True
    assert data["workspace_name"] == "Demo List"
    assert "verified" in data["message"].lower()


def test_project_management_test_connection_marks_unsupported_provider_preview() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/project-management/test-connection",
        json={"provider": "jira"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "jira"
    assert data["connected"] is False
    assert "preview" in data["message"].lower()
