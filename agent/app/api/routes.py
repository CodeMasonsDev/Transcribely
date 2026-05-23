import json

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from langchain_core.exceptions import OutputParserException

from app.agents.orchestrator import build_orchestrator
from app.core.config import get_settings
from app.schemas.clickup import (
    ProjectManagementConnectionRequest,
    ProjectManagementConnectionResponse,
    ProjectManagementPublishRequest,
    PublishTicketsRequest,
    PublishTicketsResponse,
)
from app.schemas.responses import HealthResponse, OrchestrationResponse
from app.services.clickup import publish_clickup_tasks, test_clickup_connection
from app.services.transcript_reader import read_transcript_input

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", model=settings.ai_model)


@router.post("/api/v1/orchestrate", response_model=OrchestrationResponse)
async def orchestrate_transcript(
    transcript_text: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
) -> OrchestrationResponse:
    transcript_input = await read_transcript_input(transcript_text, file)
    orchestrator = build_orchestrator()
    try:
        return await orchestrator.run(transcript_input)
    except OutputParserException as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "The AI model returned output that did not match the required schema. "
                "Try again with a clearer or longer transcript."
            ),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/api/v1/orchestrate/stream")
async def stream_orchestrate_transcript(
    transcript_text: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
) -> StreamingResponse:
    transcript_input = await read_transcript_input(transcript_text, file)
    orchestrator = build_orchestrator()

    async def stream_events():
        try:
            async for event_type, payload in orchestrator.stream_run(transcript_input):
                if event_type == "final" and isinstance(payload, OrchestrationResponse):
                    data = payload.model_dump(mode="json")
                else:
                    data = {"content": str(payload)}

                yield json.dumps({"type": event_type, "data": data}) + "\n"
        except Exception as exc:
            yield json.dumps(
                {
                    "type": "error",
                    "data": {
                        "message": (
                            "The AI model returned output that could not be converted "
                            f"into ticket cards: {exc}"
                        )
                    },
                }
            ) + "\n"

    return StreamingResponse(
        stream_events(),
        media_type="application/x-ndjson",
    )


@router.post("/api/v1/clickup/publish", response_model=PublishTicketsResponse)
async def publish_clickup_tickets(
    payload: PublishTicketsRequest,
) -> PublishTicketsResponse:
    try:
        return publish_clickup_tasks(payload.tickets)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/api/v1/project-management/test-connection",
    response_model=ProjectManagementConnectionResponse,
)
async def test_project_management_connection(
    payload: ProjectManagementConnectionRequest,
) -> ProjectManagementConnectionResponse:
    if payload.provider == "clickup":
        try:
            workspace_name = test_clickup_connection()
        except RuntimeError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

        return ProjectManagementConnectionResponse(
            provider="clickup",
            connected=True,
            message="ClickUp connection verified. You can transcribe and sync reviewed tickets.",
            workspace_name=workspace_name,
        )

    provider_labels = {
        "jira": "Jira",
        "trello": "Trello",
        "other": "Other project management tools",
    }
    return ProjectManagementConnectionResponse(
        provider=payload.provider,
        connected=False,
        message=(
            f"{provider_labels[payload.provider]} setup is saved as a preview. "
            "Live publishing is not connected in this version."
        ),
    )


@router.post(
    "/api/v1/project-management/publish",
    response_model=PublishTicketsResponse,
)
async def publish_project_management_tickets(
    payload: ProjectManagementPublishRequest,
) -> PublishTicketsResponse:
    if payload.provider == "clickup":
        try:
            return publish_clickup_tasks(payload.tickets)
        except RuntimeError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    provider_labels = {
        "jira": "Jira",
        "trello": "Trello",
        "other": "Other project management tools",
    }
    raise HTTPException(
        status_code=501,
        detail=(
            f"{provider_labels[payload.provider]} publishing is not connected yet. "
            "Select ClickUp to publish reviewed tickets in this version."
        ),
    )
