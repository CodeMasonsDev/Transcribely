import app.services.llm as llm_module
from app.core.config import get_settings


class FakeChatOpenAI:
    kwargs = None

    def __init__(self, **kwargs):
        FakeChatOpenAI.kwargs = kwargs


def test_build_chat_model_uses_chat_openai_with_openai_compatible_deepseek_config(
    monkeypatch,
) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "ai_api_key", "test-key")
    monkeypatch.setattr(settings, "ai_model", "deepseek-v4-flash")
    monkeypatch.setattr(settings, "ai_base_url", "https://api.deepseek.com")
    monkeypatch.setattr(llm_module, "get_chat_openai_class", lambda: FakeChatOpenAI)

    llm_module.build_chat_model()

    assert FakeChatOpenAI.kwargs == {
        "model": "deepseek-v4-flash",
        "api_key": "test-key",
        "base_url": "https://api.deepseek.com",
        "temperature": 2,
        "max_completion_tokens": 3000,
        "timeout": 60,
        "max_retries": 2,
    }
