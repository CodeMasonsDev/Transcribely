import asyncio
from io import BytesIO

import pytest
from fastapi import HTTPException, UploadFile

from app.services.transcript_reader import (
    read_transcript_input,
    validate_transcript_text,
    validate_txt_filename,
)


def test_validate_transcript_text_accepts_content() -> None:
    assert validate_transcript_text("  transcript content  ") == "transcript content"


def test_validate_transcript_text_rejects_empty_content() -> None:
    with pytest.raises(HTTPException) as exc_info:
        validate_transcript_text("   ")

    assert exc_info.value.status_code == 400


def test_validate_txt_filename_accepts_txt() -> None:
    assert validate_txt_filename("meeting.txt") == "meeting.txt"


def test_validate_txt_filename_rejects_unsupported_extension() -> None:
    with pytest.raises(HTTPException) as exc_info:
        validate_txt_filename("meeting.docx")

    assert exc_info.value.status_code == 400


def test_read_transcript_input_prefers_text_over_file() -> None:
    upload = UploadFile(filename="meeting.txt", file=BytesIO(b"file content"))
    result = asyncio.run(read_transcript_input(" pasted content ", upload))

    assert result.content == "pasted content"
    assert result.source == "text"


def test_read_transcript_input_accepts_txt_upload() -> None:
    upload = UploadFile(filename="meeting.txt", file=BytesIO(b"file content"))
    result = asyncio.run(read_transcript_input(None, upload))

    assert result.content == "file content"
    assert result.source == "file"
    assert result.filename == "meeting.txt"
