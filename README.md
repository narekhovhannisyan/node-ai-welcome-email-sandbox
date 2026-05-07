# node-ai-welcome-email-sandbox

TypeScript + Express signup app that generates AI-personalized welcome copy and sends it through Mailtrap template API with config-only sandbox/production switching.

## Features

- Server-rendered `GET /signup` form and `POST /signup` submit flow
- Zod validation with field-level errors and preserved values
- OpenAI-based personalization (`headline`, `body`, `cta_text`)
- Graceful fallback to generic welcome copy on AI failures
- Mailtrap template send with env-only sandbox/production toggle
- Mail send failures logged without breaking user flow
- In-process rate limit on `POST /signup` (5 req/min/IP)

## Requirements

- Node.js 20+
- npm 10+
- OpenAI API key
- Mailtrap API token + template UUID

## Setup

```bash
npm install
cp .env.example .env
```

Fill `.env`:

```bash
PORT=3000
APP_BASE_URL=http://localhost:3000
OPENAI_API_KEY=<SECRET>
OPENAI_MODEL=gpt-4o-mini
MAILTRAP_API_TOKEN=<SECRET>
MAILTRAP_SANDBOX=true
MAILTRAP_INBOX_ID=0000000
MAILTRAP_ACCOUNT_ID=0000000
MAILTRAP_TEMPLATE_UUID=00000000-0000-0000-0000-000000000000
MAIL_FROM_ADDRESS=hello@example.com
MAIL_FROM_NAME=Product Team
```

## Run

```bash
npm run dev
```

Open `http://localhost:3000/signup`.

## Build and start

```bash
npm run build
npm start
```

## Sandbox vs production mode

- `MAILTRAP_SANDBOX=true`:
  - sends through Mailtrap sandbox host
  - requires `MAILTRAP_INBOX_ID` and `MAILTRAP_ACCOUNT_ID`
- `MAILTRAP_SANDBOX=false`:
  - sends through Mailtrap transactional host
  - no code changes required

## Failure behavior

- OpenAI failure modes (API/network/timeouts/rate limits/invalid JSON/schema mismatch) automatically return generic welcome copy.
- Mailtrap send failures are logged and the request still returns success page response.

## Routes

- `GET /health` - health check
- `GET /signup` - render signup form
- `POST /signup` - validate input, generate copy, send template email

## Example Mailtrap template variables

The app sends:

- `user_name`
- `headline`
- `body`
- `cta_text`
