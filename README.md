# Critiq

Critiq is a production-oriented MVP for structured AI design critique. A user uploads a UI screenshot, chooses the screen context and review mode, and receives a JSON-backed critique rendered as result cards.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- OpenAI Responses API with vision input
- No database
- No auth

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

Set `OPENAI_API_KEY` in `.env.local`.

3. Start the app:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Production assumptions

- Target platform: Vercel
- Stateless architecture
- Single `POST /api/analyze` serverless route
- No persistence of uploads or analysis history
- Best-effort in-memory rate limiting suitable for MVP, not for multi-region abuse prevention

## Image and API limits

- Supported image formats: PNG, JPG, WEBP, GIF
- Max upload size: 3 MB
- Basic per-IP analysis rate limit is enabled
- OpenAI request timeout is enabled to avoid hanging serverless invocations

## Commands

```bash
npm run dev
npm run build
npm run test
```

## Production checklist

- `OPENAI_API_KEY` is configured in Vercel project settings
- `npm run build` passes
- `POST /api/analyze` works in preview deployment
- Rate limit errors are rendered correctly in the UI
- Invalid file type and oversized image errors are rendered correctly in the UI

## Known constraints

- Critique quality depends on screenshot clarity and visible UI context
- The app does not infer hidden interactions not visible in the screenshot
- In-memory rate limiting is reset on cold start and is not globally shared across serverless instances
