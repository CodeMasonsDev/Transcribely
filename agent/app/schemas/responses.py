from pydantic import BaseModel, Field

from app.schemas.tickets import EngineeringTicket
from app.schemas.transcript import TranscriptSource


class DepartmentActionItem(BaseModel):
    department: str = Field(..., min_length=1)
    action: str = Field(..., min_length=1)
    owner_type: str = Field(..., min_length=1)


class OrchestrationMetadata(BaseModel):
    model: str
    ticket_count: int
    source: TranscriptSource


class OrchestrationResponse(BaseModel):
    executive_summary: str = Field(..., min_length=1)
    key_decisions: list[str] = Field(default_factory=list)
    open_questions: list[str] = Field(default_factory=list)
    department_action_items: list[DepartmentActionItem] = Field(default_factory=list)
    tickets: list[EngineeringTicket] = Field(..., min_length=1)
    metadata: OrchestrationMetadata


class HealthResponse(BaseModel):
    status: str
    model: str
