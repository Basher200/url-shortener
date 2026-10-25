# URL Shortener

A backend service that shortens long URLs, redirects visitors, and (soon) tracks click analytics.
Built with Node.js, Fastify, and PostgreSQL. The goal of this project is to practice
real backend engineering concerns: API design, caching, async processing, rate limiting,
and measuring performance, one layer at a time.

## Features

- Create short links, with an optional custom alias and expiry date
- Redirect with `302` (so every visit can be counted later)
- Distinct errors: `404` (never existed) vs `410` (expired or disabled)
- Uniqueness guaranteed by a database unique index, even under concurrent requests

## Quick start

Requirements: Node.js 20+ and Docker.

```bash
cp .env.example .env        # on Windows: copy .env.example .env
docker compose up -d        # starts PostgreSQL and creates the schema
npm install
npm run dev
```

Create a link and open it:

```bash
curl -X POST http://localhost:3000/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{"longUrl":"https://example.com","alias":"my-link"}'

curl -i http://localhost:3000/my-link
```

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/links` | Create a short link (`longUrl`, optional `alias`, `expiresAt`) |
| GET | `/:code` | Redirect (302) to the original URL |
| GET | `/health` | Health check |

Errors always use one shape:

```json
{ "error": { "code": "ALIAS_TAKEN", "message": "The alias 'my-link' is already in use." } }
```

| Status | Meaning |
|--------|---------|
| 400 | Invalid input (`INVALID_URL`, `INVALID_ALIAS`, `INVALID_EXPIRY`, `VALIDATION_ERROR`) |
| 404 | Link never existed |
| 409 | Alias already taken |
| 410 | Link expired or disabled |

## Tests

```bash
docker compose up -d   # integration tests need the database
npm test
```

Note: the integration tests empty the `links` table, so use a development database.

## Architecture

```
src/
├── domain/          business rules (validation, code generation, link status)
├── application/     use cases (createLink, resolveLink)
├── infrastructure/  PostgreSQL and in-memory repositories
└── api/             HTTP routes and error mapping
```

Dependencies point inward: the domain knows nothing about HTTP or PostgreSQL,
so storage and framework can change without touching business rules.

## Roadmap

- [x] Walking skeleton: create and redirect, backed by PostgreSQL
- [ ] Baseline load test (k6)
- [ ] Redis cache for the redirect path
- [ ] Async click tracking with a queue and worker
- [ ] Rate limiting
- [ ] Security hardening (SSRF protection) and observability