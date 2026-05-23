from app.schemas.requirements import ExtractedRequirements
from app.schemas.transcript import CleanedTranscript


class RequirementsExtractorAgent:
    def __init__(self, llm) -> None:
        self.chain = llm.with_structured_output(ExtractedRequirements, method="json_mode")

    async def run(self, cleaned: CleanedTranscript) -> ExtractedRequirements:
        messages = [
            (
                "system",
                "You are a Technical AI Product Orchestrator. Extract business and "
                "product requirements from cleaned meeting notes. Return only valid "
                "JSON matching the requested schema.",
            ),
            (
                "human",
                "Analyze the cleaned transcript and extract product requirements. "
                "Include business goals, user pain points, requested features, "
                "stakeholders, dependencies, risks, assumptions, deadlines, questions "
                "requiring clarification, and suggested technical components.\n\n"
                f"Cleaned transcript JSON:\n{cleaned.model_dump_json()}",
            ),
        ]
        return await self.chain.ainvoke(messages)
