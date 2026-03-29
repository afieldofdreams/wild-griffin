# Wild Griffin

Nature's Digital Twin — gamified environmental monitoring.

## Quick Start

```bash
# Start Postgres (port 5434) + Redis
docker compose up -d

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed sample sites
npm run db:seed

# Start API (port 3000)
npm run api

# Start mobile (in separate terminal)
npm run mobile
```

## Project Structure

```
packages/
  shared/    — Types, constants, survey schemas (used by API + mobile)
  api/       — Express API server
  mobile/    — Expo React Native app
```

## Key Conventions

- All timestamps are ISO 8601 UTC
- API versioned under /v1/
- Zod validation on all endpoints
- Survey submissions require client-generated idempotency keys (UUID)
- Phone numbers hashed with bcrypt (pgcrypto), not SHA-256
- `days_since_survey` is computed at query time, never stored
- Survey question schemas are versioned per site type in `packages/shared/src/surveys.ts`
