from typing import Literal

from pydantic import BaseModel, Field, field_validator


Priority = Literal["High", "Medium", "Low"]


class EngineeringTicket(BaseModel):
    id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    priority: Priority
    description: str = Field(..., min_length=1)
    acceptance_criteria: list[str] = Field(default_factory=list)

    @field_validator("acceptance_criteria", mode="after")
    @classmethod
    def require_acceptance_criteria(cls, value: list[str]) -> list[str]:
        if not value:
            raise ValueError("acceptance_criteria must not be empty")
        return value


class GeneratedTickets(BaseModel):
    tickets: list[EngineeringTicket] = Field(..., min_length=1)
