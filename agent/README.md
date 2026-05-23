# AI Sprint Ticket Orchestrator Agent Backend

FastAPI backend that uses LangChain `ChatOpenAI` against DeepSeek's OpenAI-compatible API to turn pasted or uploaded `.txt` meeting transcripts into structured engineering tickets.

## Setup

```bash
cd agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Add your model settings to `.env`:

```env
AI_API_KEY=your_key_here
AI_MODEL=deepseek-v4-flash
AI_BASE_URL=https://api.deepseek.com
```

To publish reviewed tickets into ClickUp, also add:

```env
CLICKUP_API_TOKEN=your_personal_token
CLICKUP_LIST_ID=your_target_list_id
CLICKUP_DEFAULT_STATUS=to do
CLICKUP_DEFAULT_TAGS=ai-generated
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Open:

```text
http://127.0.0.1:8000/docs
```

## Endpoints

- `GET /health`
- `POST /api/v1/orchestrate`
- `POST /api/v1/clickup/publish`

`POST /api/v1/orchestrate` accepts multipart form data:

- `transcript_text`: pasted transcript text
- `file`: optional `.txt` transcript upload

If both are supplied, `transcript_text` is used.

`POST /api/v1/clickup/publish` accepts reviewed tickets using the current
ClickUp-style ticket schema:

- `id`
- `title`
- `priority`
- `description`
- `acceptance_criteria`

The endpoint creates one ClickUp task per submitted ticket in the configured
ClickUp List and returns created task URLs plus any per-ticket failures.
