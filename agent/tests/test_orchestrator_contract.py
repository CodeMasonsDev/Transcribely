import asyncio

from app.agents.orchestrator import TranscriptOrchestrator
from app.schemas.requirements import ExtractedRequirements
from app.schemas.tickets import EngineeringTicket, GeneratedTickets
from app.schemas.transcript import CleanedTranscript, TranscriptInput


class FakeCleaner:
    async def run(self, transcript: str) -> CleanedTranscript:
        return CleanedTranscript(
            cleaned_transcript=transcript,
            topic_sections=["AI workflow"],
            speaker_concerns=["Manual ticket writing is slow."],
            important_decisions=["Use a human review gate."],
            unclear_items=["Which tracker should receive final tickets?"],
        )


class FakeRequirementsExtractor:
    async def run(self, cleaned: CleanedTranscript) -> ExtractedRequirements:
        return ExtractedRequirements(
            executive_summary="The team needs an AI workflow for ticket generation.",
            business_goals=["Reduce manual PM documentation time."],
            user_pain_points=["Transcript review takes too long."],
            requested_features=[
                "Transcript upload",
                "Ticket generation",
                "QA checklist",
                "ClickUp export mapping",
            ],
            stakeholders=["Product", "Engineering", "QA"],
            dependencies=["DeepSeek API key"],
            risks=["AI output requires review."],
            assumptions=["The user supplies a usable transcript."],
            deadlines=["Demo-ready v0.1"],
            questions_requiring_clarification=["Should Jira be first integration?"],
            suggested_technical_components=["FastAPI", "LangChain", "DeepSeek"],
        )


class FakeTicketGenerator:
    async def run(
        self,
        requirements: ExtractedRequirements,
        corrective_instruction: str | None = None,
    ) -> GeneratedTickets:
        return GeneratedTickets(
            tickets=[
                build_ticket("AI-001", "Build transcript intake"),
                build_ticket("AI-002", "Generate engineering tickets"),
                build_ticket("AI-003", "Add review gate"),
                build_ticket("AI-004", "Map tickets to ClickUp fields"),
            ]
        )


class FailingAgent:
    async def run(self, *args, **kwargs):
        raise ValueError("model returned invalid structured output")


def build_ticket(ticket_id: str, title: str) -> EngineeringTicket:
    return EngineeringTicket(
        id=ticket_id,
        title=title,
        priority="High",
        description="Create a ClickUp-style task for the requested workflow.",
        acceptance_criteria=["The response contains required fields."],
    )


def test_orchestrator_returns_frontend_contract() -> None:
    orchestrator = TranscriptOrchestrator(
        cleaner=FakeCleaner(),
        requirements_extractor=FakeRequirementsExtractor(),
        ticket_generator=FakeTicketGenerator(),
    )

    result = asyncio.run(
        orchestrator.run(
            TranscriptInput(content="meeting transcript", source="text"),
        )
    )

    assert result.metadata.model == "deepseek-v4-flash"
    assert result.metadata.ticket_count == len(result.tickets)
    assert result.metadata.source == "text"
    assert len(result.tickets) == 4
    assert set(result.tickets[0].model_dump()) == {
        "id",
        "title",
        "priority",
        "description",
        "acceptance_criteria",
    }
    assert all(ticket.description for ticket in result.tickets)
    assert all(ticket.acceptance_criteria for ticket in result.tickets)


def test_orchestrator_falls_back_when_structured_ai_output_fails() -> None:
    orchestrator = TranscriptOrchestrator(
        cleaner=FakeCleaner(),
        requirements_extractor=FailingAgent(),
        ticket_generator=FailingAgent(),
    )

    result = asyncio.run(
        orchestrator.run(
            TranscriptInput(content="meeting transcript", source="text"),
        )
    )

    assert result.metadata.ticket_count == len(result.tickets)
    assert len(result.tickets) >= 1
    assert all(ticket.description for ticket in result.tickets)
    assert all(ticket.acceptance_criteria for ticket in result.tickets)
