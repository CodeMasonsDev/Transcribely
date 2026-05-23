import asyncio
import os

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.agents.transcribely import SYSTEM_PROMPT


TRANSCRIPT = """
Paste a transcript here to test Transcribely from the command line.
"""


async def agent() -> None:
    load_dotenv(override=True)

    model = ChatOpenAI(
        model=os.getenv("AI_MODEL"),
        api_key=os.getenv("AI_API_KEY"),
        base_url=os.getenv("AI_BASE_URL", "https://api.deepseek.com"),
        temperature=2,
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=TRANSCRIPT),
    ]

    async for chunk in model.astream(messages):
        print(chunk.content, end="", flush=True)


def main() -> None:
    asyncio.run(agent())


if __name__ == "__main__":
    main()
