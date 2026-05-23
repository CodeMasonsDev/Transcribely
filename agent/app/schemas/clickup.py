from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.tickets import EngineeringTicket

ProjectManagementProvider = Literal["clickup", "jira", "trello", "other"]


class PublishTicketsRequest(BaseModel):
    tickets: list[EngineeringTicket] = Field(..., min_length=1)


class ProjectManagementPublishRequest(PublishTicketsRequest):
    provider: ProjectManagementProvider


class ProjectManagementConnectionRequest(BaseModel):
    provider: ProjectManagementProvider


class ProjectManagementConnectionResponse(BaseModel):
    provider: ProjectManagementProvider
    connected: bool
    message: str
    workspace_name: str | None = None


class PublishedClickUpTask(BaseModel):
    local_ticket_id: str
    clickup_task_id: str
    name: str
    url: str
    status: str
    checklist_created: bool = False
    checklist_item_count: int = 0
    warning: str | None = None


class FailedClickUpTask(BaseModel):
    local_ticket_id: str
    title: str
    error: str


class PublishTicketsResponse(BaseModel):
    created: list[PublishedClickUpTask] = Field(default_factory=list)
    failed: list[FailedClickUpTask] = Field(default_factory=list)
