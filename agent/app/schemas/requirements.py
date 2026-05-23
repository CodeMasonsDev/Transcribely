from pydantic import BaseModel, Field


class ExtractedRequirements(BaseModel):
    executive_summary: str = Field(..., min_length=1)
    business_goals: list[str] = Field(default_factory=list)
    user_pain_points: list[str] = Field(default_factory=list)
    requested_features: list[str] = Field(default_factory=list)
    stakeholders: list[str] = Field(default_factory=list)
    dependencies: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    deadlines: list[str] = Field(default_factory=list)
    questions_requiring_clarification: list[str] = Field(default_factory=list)
    suggested_technical_components: list[str] = Field(default_factory=list)
