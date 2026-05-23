from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"

load_dotenv(ENV_FILE)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ai_api_key: str = Field(default="", alias="AI_API_KEY")
    ai_base_url: str = Field(default="https://api.deepseek.com", alias="AI_BASE_URL")
    ai_model: str = Field(default="deepseek-v4-flash", alias="AI_MODEL")
    allowed_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        alias="ALLOWED_ORIGINS",
    )
    clickup_api_token: str = Field(default="", alias="CLICKUP_API_TOKEN")
    clickup_list_id: str = Field(default="", alias="CLICKUP_LIST_ID")
    clickup_default_status: str = Field(default="to do", alias="CLICKUP_DEFAULT_STATUS")
    clickup_default_tags: str = Field(
        default="ai-generated",
        alias="CLICKUP_DEFAULT_TAGS",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.allowed_origins.split(",")
            if origin.strip()
        ]

    @property
    def clickup_tags(self) -> list[str]:
        return [
            tag.strip()
            for tag in self.clickup_default_tags.split(",")
            if tag.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
