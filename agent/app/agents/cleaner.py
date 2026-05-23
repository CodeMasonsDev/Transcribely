from app.schemas.transcript import CleanedTranscript


class TranscriptCleanerAgent:
    def __init__(self, llm) -> None:
        self.chain = llm.with_structured_output(CleanedTranscript, method="json_mode")

    async def run(self, transcript: str) -> CleanedTranscript:
        try:
            return await self._invoke(transcript)
        except Exception:
            try:
                return await self._invoke(
                    transcript,
                    corrective_instruction=(
                        "Your previous response was invalid because cleaned_transcript "
                        "was empty. cleaned_transcript must contain the cleaned meeting "
                        "content and must not be an empty string."
                    ),
                )
            except Exception:
                return self._fallback_cleaned_transcript(transcript)

    async def _invoke(
        self,
        transcript: str,
        corrective_instruction: str | None = None,
    ) -> CleanedTranscript:
        correction = ""
        if corrective_instruction:
            correction = f"\n\nCorrection required: {corrective_instruction}"

        messages = [
            (
                "system",
                "You are an AI operations assistant for a marketing consultancy. "
                "Clean raw meeting transcripts while preserving business requirements, "
                "decisions, concerns, and action items. Return only valid JSON matching "
                "the requested schema. The JSON must include a non-empty "
                "cleaned_transcript string.",
            ),
            (
                "human",
                "Clean this transcript. Remove filler words, repeated statements, "
                "irrelevant small talk, and unclear fragments. Keep speaker concerns, "
                "topic sections, decisions, and unclear items.\n\n"
                "Return JSON with these keys: cleaned_transcript, topic_sections, "
                "speaker_concerns, important_decisions, unclear_items.\n\n"
                f"Transcript:\n{transcript}"
                f"{correction}",
            ),
        ]
        return await self.chain.ainvoke(messages)

    @staticmethod
    def _fallback_cleaned_transcript(transcript: str) -> CleanedTranscript:
        cleaned = transcript.strip()
        return CleanedTranscript(
            cleaned_transcript=cleaned,
            topic_sections=["Uncategorized transcript content"],
            speaker_concerns=[],
            important_decisions=[],
            unclear_items=[
                "The transcript cleaner returned invalid structured output, so the original transcript was preserved for downstream extraction."
            ],
        )
