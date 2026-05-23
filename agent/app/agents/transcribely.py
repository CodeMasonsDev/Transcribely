import json
from collections.abc import AsyncIterator

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import ValidationError

from app.core.config import get_settings
from app.schemas.tickets import EngineeringTicket
from app.services.llm import build_chat_model


SYSTEM_PROMPT = """
You are an AI Ticket Orchestrator for a product development workflow.

Your task is to analyze meeting transcripts, planning notes, stakeholder discussions, or product conversations and convert them into clear, actionable engineering tickets.

You must extract all meaningful work items from the transcript. Generate as many tickets as needed based on the requirements, decisions, issues, dependencies, and priorities discussed.

Each ticket must follow this exact structure:

{
  "id": "string",
  "title": "string",
  "priority": "HIGH | MEDIUM | LOW",
  "description": "string",
  "acceptance_criteria": ["string"]
}

Rules for ticket generation:

1. Generate tickets only from information found in the transcript.
2. Do not invent features, requirements, or technical details that were not mentioned.
3. If a requirement is implied clearly by the discussion, you may convert it into a ticket.
4. Break large requirements into separate tickets when they represent different implementation areas.
5. Combine small related details only when they belong to the same feature.
6. Use clear, engineering-friendly titles.
7. Write descriptions that explain the purpose, context, and expected behavior of the ticket.
8. Acceptance criteria must be specific, testable, and written as checklist-style statements.
9. Prioritize tickets based on the transcript:
   - HIGH: Core product functionality, required backend/frontend work, validation, critical user flows, blockers.
   - MEDIUM: Important but not required for the first working version, enhancements, storage, backup options, documentation.
   - LOW: Nice-to-have features, future-facing items, mock/demo actions, non-critical enhancements.
10. If the transcript explicitly says something is out of scope, do not create a build ticket for it unless the task is to document or exclude it.
11. If the transcript mentions QA requirements, generate separate QA tickets.
12. If the transcript mentions error handling, validation, or edge cases, generate dedicated tickets for them.
13. If the transcript mentions UI behavior, generate frontend tickets.
14. If the transcript mentions API, database, schema, or backend logic, generate backend tickets.
15. Avoid vague acceptance criteria such as “works correctly” or “is user-friendly.”
16. Every ticket must have at least one acceptance criterion.
17. Use unique sequential IDs based on the project name when possible.

Output rules:

- Return only a valid JSON array.
- Do not include markdown.
- Do not include explanations before or after the JSON.
- Do not include comments.
- Do not include trailing commas.
- The output must be parseable as JSON.
"""


class TranscribelyTicketAgent:
    def __init__(self) -> None:
        self.model = build_chat_model()
        self.settings = get_settings()

    async def stream_ticket_json(self, transcript: str) -> AsyncIterator[str]:
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=transcript),
        ]

        async for chunk in self.model.astream(messages):
            content = getattr(chunk, "content", "")
            if isinstance(content, str) and content:
                yield content

    async def generate_tickets(self, transcript: str) -> tuple[list[EngineeringTicket], str]:
        raw_output = ""
        async for chunk in self.stream_ticket_json(transcript):
            raw_output += chunk

        return self.parse_tickets(raw_output), raw_output

    def parse_tickets(self, raw_output: str) -> list[EngineeringTicket]:
        cleaned_output = self._extract_json_array(raw_output)
        try:
            raw_tickets = json.loads(cleaned_output)
        except json.JSONDecodeError as exc:
            raise ValueError("AI output was not valid JSON.") from exc

        if not isinstance(raw_tickets, list):
            raise ValueError("AI output must be a JSON array of tickets.")

        tickets: list[EngineeringTicket] = []
        for index, raw_ticket in enumerate(raw_tickets, start=1):
            if not isinstance(raw_ticket, dict):
                raise ValueError("Every AI ticket must be a JSON object.")

            ticket_data = {
                **raw_ticket,
                "id": str(raw_ticket.get("id") or f"AI-{index:03d}"),
                "priority": self._normalize_priority(str(raw_ticket.get("priority") or "")),
                "acceptance_criteria": raw_ticket.get("acceptance_criteria") or [],
            }
            try:
                tickets.append(EngineeringTicket.model_validate(ticket_data))
            except ValidationError as exc:
                raise ValueError("AI ticket output did not match the ticket schema.") from exc

        return tickets

    @staticmethod
    def _extract_json_array(raw_output: str) -> str:
        output = raw_output.strip()
        if output.startswith("```"):
            output = output.removeprefix("```json").removeprefix("```").strip()
            output = output.removesuffix("```").strip()

        start = output.find("[")
        end = output.rfind("]")
        if start == -1 or end == -1 or end < start:
            raise ValueError("AI output did not include a JSON array.")

        return output[start : end + 1]

    @staticmethod
    def _normalize_priority(priority: str) -> str:
        normalized = priority.strip().lower()
        if normalized == "high":
            return "High"
        if normalized == "medium":
            return "Medium"
        if normalized == "low":
            return "Low"
        return "Medium"
