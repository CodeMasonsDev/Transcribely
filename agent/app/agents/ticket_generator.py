from app.schemas.requirements import ExtractedRequirements
from app.schemas.tickets import GeneratedTickets


class TicketGeneratorAgent:
    def __init__(self, llm) -> None:
        self.chain = llm.with_structured_output(GeneratedTickets, method="json_mode")

    async def run(
        self,
        requirements: ExtractedRequirements,
        corrective_instruction: str | None = None,
    ) -> GeneratedTickets:
        correction = ""
        if corrective_instruction:
            correction = f"\n\nCorrection required: {corrective_instruction}"

        messages = [
            (
                "system",
                "You are a senior technical product manager. Convert extracted "
                "requirements into ClickUp-ready task tickets. Decide how many "
                "tickets are necessary based on the transcript. "
                "Write detailed, implementation-ready task descriptions. "
                "Return only valid JSON matching this shape: "
                '{"tickets":[{"id":"AI-001","title":"Task title","priority":"High",'
                '"description":"Task description","acceptance_criteria":["Criterion"]}]}.',
            ),
            (
                "human",
                "Create all necessary ClickUp-style tickets for the distinct buildable "
                "work described in the transcript. Do not force a fixed number of "
                "tickets. Split separate features, integration work, review workflows, "
                "or validation work into separate tickets when useful. Each ticket must include "
                "only these fields: id, title, priority, description, and "
                "acceptance_criteria. Priority must be exactly High, Medium, or Low. "
                "Use sequential ids like AI-001, AI-002, AI-003. The description should "
                "be detailed enough for an engineer to start work: include the purpose, "
                "expected behavior, validation rules, data handled, backend/frontend "
                "touchpoints, and important constraints when they are available. Use "
                "4 to 6 specific implementation-focused sentences per description. "
                "Acceptance criteria should include 4 to 7 concrete, testable checklist "
                "items. Do not put uncertain requirements in acceptance criteria; "
                "only include behavior that can be verified. "
                "Return JSON only. Do not include markdown.\n\n"
                f"Requirements JSON:\n{requirements.model_dump_json()}"
                f"{correction}",
            ),
        ]
        return await self.chain.ainvoke(messages)
