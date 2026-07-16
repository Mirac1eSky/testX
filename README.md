# testX

**Test products like a real user, not just a test script.**

[testX](./public/index.html) is an AI-assisted exploratory testing prototype created for **OpenAI Build Week**. It converts a product objective and expected behavior into structured user journeys, assertions, product risks, and open questions. It then demonstrates how an exploratory agent could execute those journeys and produce an evidence-oriented report.

## What works now

### 1. Live GPT-5.6 planning

`POST /api/generate-plan` uses the OpenAI Responses API with **GPT-5.6** and Structured Outputs. The model transforms the submitted product context into a typed test plan containing:

- 3–6 exploratory user journeys
- Independently verifiable assertions
- Risk levels for each journey
- Cross-product regression risks
- Open questions requiring product confirmation

The API key remains on the Node.js server and is never exposed to browser code.

### 2. Deterministic demonstration runner

The animated browser exploration is currently a deterministic demonstration, not autonomous control of an arbitrary external website. It provides a stable recording flow and illustrates:

- Agent action logs
- State-transition checks
- Cross-screen consistency analysis
- Findings grouped by severity and confidence
- Markdown report export

The interface falls back to an embedded demo plan when the API key or network is unavailable. It labels the plan source as either **GPT-5.6 live** or **Demo fallback**.

## How Codex was used

Codex was used as the primary engineering collaborator throughout the project rather than only for isolated autocomplete. It was used to:

- Convert the initial concept into a scoped Build Week prototype
- Design the end-to-end demo flow and repository architecture
- Build and refine the responsive single-page interface
- Implement asynchronous agent-run animations and state transitions
- Add the Express API boundary so the OpenAI API key stays server-side
- Integrate GPT-5.6 Structured Outputs with a Zod schema
- Add validation, error handling, and deterministic fallback behavior
- Review the distinction between live AI behavior and simulated execution
- Write setup instructions and document current limitations honestly

## How GPT-5.6 was used

GPT-5.6 is the live reasoning layer behind test-plan generation. It receives:

- Product name
- Target URL or environment
- Testing objective
- Expected behavior and requirements

It returns structured journeys and assertions focused on state transitions, persistence, navigation, recovery paths, cross-screen consistency, and regression risk.

GPT-5.6 was also used during product design to refine the finding taxonomy and determine how testX should separate:

- Confirmed requirement violations
- Likely product inconsistencies
- Usability concerns
- Open questions requiring human confirmation

## Architecture

```text
Browser UI
   |
   | POST /api/generate-plan
   v
Node.js + Express
   |
   | OpenAI Responses API + Structured Outputs
   v
GPT-5.6
   |
   | Typed JSON test plan
   v
Interactive plan + deterministic exploration demo + Markdown report
```

## Built with

- OpenAI Responses API
- GPT-5.6
- Codex
- Node.js
- Express
- JavaScript
- Zod
- HTML and CSS

## Run locally

### Requirements

- Node.js 20 or later
- An OpenAI API key for live planning

### Setup

```bash
npm install
cp .env.example .env
```

Add the key to `.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.6
PORT=3000
```

Start the app:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

Without an API key, the UI still runs and automatically switches to deterministic **Demo fallback** mode.

## Demo flow

1. Enter a product objective and expected behavior.
2. Click **Generate AI test plan**.
3. Review the GPT-5.6-generated journeys or demo fallback plan.
4. Click **Run exploratory test**.
5. Review agent actions, state checks, findings, and quality score.
6. Export the result as Markdown.

## Current limitations

- The browser execution animation is simulated.
- The prototype does not yet log into or operate arbitrary external websites.
- The displayed findings are a deterministic example based on notification-state problems.
- Live GPT-5.6 is currently used for planning, not for claiming that UI defects were observed.

## Next steps

- Add real Playwright browser control
- Capture DOM state and screenshots as evidence
- Generate findings from recorded observations
- Compare behavior between releases
- Import requirements and acceptance criteria
- Generate executable regression tests
- Connect approved findings to GitHub Issues

## Security

- Keep `.env` out of Git.
- Never put an OpenAI API key in `public/index.html`.
- All OpenAI API requests are made from `server.js`.

## License

MIT
