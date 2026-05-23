# Transcribely - AI Sprint Ticket Orchestrator

Transcribely is an automation-assisted transcript-to-task orchestrator that converts meeting discussions into structured, actionable project tickets for product, engineering, QA, and operations workflows.

It processes raw transcript text, cleans and analyzes the discussion using Large Language Models, generates structured tickets with comprehensive acceptance criteria, and syncs them directly into your team's project management workspace (like ClickUp).

---

## 🚀 Key Features

* **Transcript Cleaning & Extraction**: Paste meeting transcripts or upload `.txt` transcript files to automatically clean filler words, summarize discussions, and extract key technical requirements.
* **Structured Ticket Generation**: Generates developer-ready sprint tickets containing descriptions, prioritization (High/Medium/Low), and detailed acceptance criteria checklists.
* **Live Streaming Output**: Streams live ticket generation token-by-token directly from the FastAPI backend into the UI.
* **Approval Queue**: Review, edit, and check off tickets in an approval queue to ensure only vetted items are sent to production.
* **Integrations Hub**: Sync approved tickets to ClickUp with one click, or review preview mappings for Jira, Trello, and webhook integrations.
* **Operations Dashboard**: Monitor metrics such as ticket counts, words processed, pipeline statuses, and connection status in a unified dashboard.

---

## 📁 Repository Structure

The project is structured as a monorepo containing a Python backend agent and a Next.js frontend:

```text
├── agent/                  # FastAPI Python backend
│   ├── app/                # Application logic (routing, schemas, agent prompt)
│   │   ├── main.py         # FastAPI application entrypoint
│   │   └── ...
│   ├── tests/              # Backend unit and integration tests
│   ├── requirements.txt    # Python package dependencies
│   └── .env.example        # Template for backend credentials
│
└── my-app/                 # Next.js frontend application
    ├── app/                # Page layouts, styles, and page components
    │   ├── page.tsx        # Main dashboard and workflow logic
    │   └── layout.tsx      # App wrapper and layout metadata
    ├── public/             # Static assets (logos, icons)
    └── package.json        # NPM dependencies and scripts
```

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed on your system:
* **Python 3.9+**
* **Node.js v18+**
* **NPM** or **Yarn**

---

### Step 1: Configure & Run the Backend Agent

1. Navigate to the `agent` folder:
   ```bash
   cd agent
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows:
   python -m venv .venv
   .venv\Scripts\activate

   # macOS/Linux:
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your environment variables. Copy the `.env.example` file:
   ```bash
   # Windows PowerShell:
   Copy-Item .env.example .env

   # macOS/Linux/Git Bash:
   cp .env.example .env
   ```

5. Open the newly created `.env` file and configure your API keys:
   ```env
   # LLM Endpoint Config (DeepSeek, OpenAI, or compatible model providers)
   AI_API_KEY=your-api-key-here
   AI_MODEL=deepseek-chat
   AI_BASE_URL=https://api.deepseek.com

   # Project Management integrations (ClickUp config)
   CLICKUP_API_TOKEN=your-clickup-personal-token
   CLICKUP_LIST_ID=your-list-id-to-publish-to
   CLICKUP_DEFAULT_STATUS=to do
   CLICKUP_DEFAULT_TAGS=ai-generated
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   * The API documentation will be available at `http://127.0.0.1:8000/docs`.

---

### Step 2: Configure & Run the Frontend

1. Navigate to the `my-app` folder:
   ```bash
   cd ../my-app
   ```

2. Install the package dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` to access the Transcribely Dashboard.

## 🔌 Supported Project Management Integrations

Transcribely provides a unified Integrations Hub allowing you to connect and publish sprint tickets to the following project management platforms:

### 1. ClickUp (Live & Active)
* **Status**: Production-ready.
* **Mechanism**: Authenticates via your `CLICKUP_API_TOKEN` and publishes tasks directly to the list defined by `CLICKUP_LIST_ID`.
* **Features**:
  * Syncs ticket titles directly to ClickUp task names.
  * Maps descriptions to task descriptions.
  * Transfers priorities (High/Medium/Low) to native ClickUp priority flags.
  * Converts acceptance criteria into native, interactive ClickUp checklists.
  * Adds custom tags (default: `ai-generated`) for simple filtering.

### 2. Jira (Preview Setup)
* **Status**: Setup preview available.
* **Mechanism**: Planned for future Jira REST API connector mapping issues directly to your project boards.
* **Mapped Fields (Preview)**:
  * AI Ticket Title -> Jira Issue Summary
  * AI Ticket Description -> Jira Issue Description (with acceptance criteria formatted as a description checklist section)
  * Priority -> Jira Priority Level (High/Medium/Low)
  * Custom labels -> Jira Labels (default: `ai-generated`)

### 3. Trello (Preview Setup)
* **Status**: Setup preview available.
* **Mechanism**: Planned for future Trello API connector mapping cards and checklists to target lists.
* **Mapped Fields (Preview)**:
  * AI Ticket Title -> Trello Card Name
  * AI Ticket Description -> Trello Card Description
  * Priority -> Trello Card Label
  * Acceptance Criteria -> Trello Checklist Items

### 4. Other PM Tools (Preview Setup)
* **Status**: Setup preview available.
* **Mechanism**: Reserve adapter pathway to support generic webhooks or custom API clients.
* **Mapped Fields (Preview)**:
  * AI Ticket Title -> Task Name
  * AI Ticket Description -> Task Body
  * Priority -> Priority Field
  * Acceptance Criteria -> Checklist/Description section

---

## ⚙️ Configuration Reference

### Backend `.env` Keys

| Variable | Description | Example |
| :--- | :--- | :--- |
| `AI_API_KEY` | Secret token to authenticate LLM API calls. | `sk-ds-...` |
| `AI_MODEL` | Identifier of the LLM model to request. | `deepseek-chat` or `gpt-4o` |
| `AI_BASE_URL` | Endpoint base URL for OpenAI-compatible providers. | `https://api.deepseek.com` |
| `CLICKUP_API_TOKEN` | Personal API Token generated from ClickUp Settings. | `pk_12345678_...` |
| `CLICKUP_LIST_ID` | Specific ClickUp list ID where tickets should land. | `901802347209` |
| `CLICKUP_DEFAULT_STATUS` | Default status given to synced tasks. | `to do` |
| `CLICKUP_DEFAULT_TAGS` | Comma-separated list of tags to tag tasks. | `ai-generated` |
