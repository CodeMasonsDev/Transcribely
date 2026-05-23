from typing import Literal

from pydantic import BaseModel, Field


TranscriptSource = Literal["text", "file"]


class TranscriptInput(BaseModel):
    content: str = Field(..., min_length=1)
    source: TranscriptSource
    filename: str | None = None


class CleanedTranscript(BaseModel):
    cleaned_transcript: str = Field(..., min_length=1)
    topic_sections: list[str] = Field(default_factory=list)
    speaker_concerns: list[str] = Field(default_factory=list)
    important_decisions: list[str] = Field(default_factory=list)
    unclear_items: list[str] = Field(default_factory=list)
