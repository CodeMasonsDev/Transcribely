from fastapi import HTTPException, UploadFile

from app.schemas.transcript import TranscriptInput

MAX_TRANSCRIPT_CHARS = 250_000


def validate_transcript_text(content: str) -> str:
    cleaned = content.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Transcript content is empty.")
    if len(cleaned) > MAX_TRANSCRIPT_CHARS:
        raise HTTPException(
            status_code=413,
            detail=f"Transcript is too large. Limit is {MAX_TRANSCRIPT_CHARS} characters.",
        )
    return cleaned


def validate_txt_filename(filename: str | None) -> str:
    if not filename:
        raise HTTPException(status_code=400, detail="Uploaded file is missing a name.")
    if not filename.lower().endswith(".txt"):
        raise HTTPException(
            status_code=400,
            detail="Only .txt transcript uploads are supported in v1.",
        )
    return filename


async def read_transcript_input(
    transcript_text: str | None,
    file: UploadFile | None,
) -> TranscriptInput:
    if transcript_text and transcript_text.strip():
        return TranscriptInput(
            content=validate_transcript_text(transcript_text),
            source="text",
        )

    if file is None:
        raise HTTPException(
            status_code=400,
            detail="Provide transcript_text or upload a .txt transcript file.",
        )

    filename = validate_txt_filename(file.filename)
    raw_content = await file.read()

    try:
        decoded_content = raw_content.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="Transcript file must be UTF-8 encoded text.",
        ) from exc

    return TranscriptInput(
        content=validate_transcript_text(decoded_content),
        source="file",
        filename=filename,
    )
