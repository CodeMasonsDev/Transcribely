from app.core.config import get_settings


def get_chat_openai_class():
    try:
        from langchain_openai import ChatOpenAI
    except ImportError as exc:
        raise RuntimeError(
            "langchain-openai is not installed. Run `pip install -r requirements.txt`."
        ) from exc

    return ChatOpenAI


def build_chat_model():
    settings = get_settings()

    if not settings.ai_api_key:
        raise RuntimeError(
            "AI_API_KEY is required. Copy .env.example to .env and add a key."
        )

    chat_openai_class = get_chat_openai_class()

    return chat_openai_class(
        model=settings.ai_model,
        api_key=settings.ai_api_key,
        base_url=settings.ai_base_url,
        temperature=2,
        max_completion_tokens=3000,
        timeout=60,
        max_retries=2,
    )
