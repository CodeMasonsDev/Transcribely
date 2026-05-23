import asyncio

from app.agents.cleaner import TranscriptCleanerAgent


class AlwaysInvalidChain:
    async def ainvoke(self, messages):
        raise ValueError("invalid structured output")


class AlwaysInvalidLlm:
    def with_structured_output(self, schema, method):
        return AlwaysInvalidChain()


def test_cleaner_falls_back_to_original_transcript_after_invalid_ai_output() -> None:
    agent = TranscriptCleanerAgent(AlwaysInvalidLlm())

    result = asyncio.run(agent.run("Maya: We need transcript upload and review."))

    assert result.cleaned_transcript == "Maya: We need transcript upload and review."
    assert result.unclear_items
