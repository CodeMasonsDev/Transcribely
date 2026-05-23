from collections.abc import AsyncIterator

from app.agents.transcribely import TranscribelyTicketAgent
from app.core.config import get_settings
from app.schemas.responses import DepartmentActionItem
from app.schemas.responses import OrchestrationMetadata, OrchestrationResponse
from app.schemas.requirements import ExtractedRequirements
from app.schemas.tickets import EngineeringTicket, GeneratedTickets
from app.schemas.transcript import TranscriptInput


class TranscriptOrchestrator:
    def __init__(
        self,
        ticket_agent: TranscribelyTicketAgent | None = None,
        cleaner=None,
        requirements_extractor=None,
        ticket_generator=None,
    ) -> None:
        self.ticket_agent = ticket_agent
        self.cleaner = cleaner
        self.requirements_extractor = requirements_extractor
        self.ticket_generator = ticket_generator
        self.settings = get_settings()

    @classmethod
    def from_chat_model(cls) -> "TranscriptOrchestrator":
        return cls(ticket_agent=TranscribelyTicketAgent())

    async def run(self, transcript_input: TranscriptInput) -> OrchestrationResponse:
        if self.ticket_agent:
            tickets, _raw_output = await self.ticket_agent.generate_tickets(
                transcript_input.content
            )
            return self._build_response(tickets, transcript_input)

        tickets = await self._run_legacy_agents(transcript_input)
        return self._build_response(tickets, transcript_input)

    async def stream_run(
        self,
        transcript_input: TranscriptInput,
    ) -> AsyncIterator[tuple[str, str | OrchestrationResponse]]:
        raw_output = ""
        async for chunk in self.ticket_agent.stream_ticket_json(transcript_input.content):
            raw_output += chunk
            yield "token", chunk

        tickets = self.ticket_agent.parse_tickets(raw_output)
        yield "final", self._build_response(tickets, transcript_input)

    async def _run_legacy_agents(
        self,
        transcript_input: TranscriptInput,
    ) -> list[EngineeringTicket]:
        try:
            cleaned = await self.cleaner.run(transcript_input.content)
            requirements = ExtractedRequirements.model_validate(
                await self.requirements_extractor.run(cleaned)
            )
            generated = GeneratedTickets.model_validate(
                await self.ticket_generator.run(requirements)
            )
            return generated.tickets
        except Exception:
            return [
                EngineeringTicket(
                    id="AI-001",
                    title="Review generated transcript requirements",
                    priority="High",
                    description=(
                        "Create a reviewable engineering task from the supplied "
                        "transcript when the AI pipeline cannot produce a full "
                        "structured response."
                    ),
                    acceptance_criteria=[
                        "The fallback ticket contains all required frontend fields."
                    ],
                )
            ]

    def _build_response(
        self,
        tickets: list[EngineeringTicket],
        transcript_input: TranscriptInput,
    ) -> OrchestrationResponse:
        return OrchestrationResponse(
            executive_summary=(
                f"Transcribely generated {len(tickets)} engineering ticket"
                f"{'' if len(tickets) == 1 else 's'} from the supplied transcript."
            ),
            key_decisions=[],
            open_questions=[],
            department_action_items=[],
            tickets=tickets,
            metadata=OrchestrationMetadata(
                model=self.settings.ai_model,
                ticket_count=len(tickets),
                source=transcript_input.source,
            ),
        )


def build_orchestrator() -> TranscriptOrchestrator:
    return TranscriptOrchestrator.from_chat_model()
