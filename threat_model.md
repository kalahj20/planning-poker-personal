# Threat Model

## Project Overview

Planning Poker is a Replit-hosted pnpm monorepo with a React/Vite frontend, an Express 5 API, and a PostgreSQL database accessed through Drizzle ORM. Teams create a room, share a six-character room code, join as participants, and vote on stories together.

Production traffic reaches two main artifacts: the static planning-poker frontend at `/` and the API server at `/api`. The mockup sandbox artifact under `/__mockup` is treated as development-only and out of production scope unless deployment evidence shows otherwise. Per platform assumptions, transport security is handled by Replit and `NODE_ENV` is `production` in deployed API builds.

The application does not implement account-based authentication. Access to a room is effectively gated by possession of the room code and by any server-side checks attached to participant- or room-mutating endpoints.

## Assets

- **Room integrity** — active story title, reveal state, round state, backlog contents, teams, and participant assignments. Unauthorized modification can disrupt planning sessions or falsify estimates.
- **Participant identity and presence** — participant UUIDs, display names, spectator status, and team membership. Impersonation lets an attacker cast votes or act as another participant.
- **Vote secrecy before reveal** — unrevealed votes should remain hidden until the intended reveal event.
- **Historical estimates and vote history** — completed story estimates and recorded votes are business data for sprint planning and retrospective analysis.
- **Database-backed session state** — rooms, groups, participants, stories, and votes in PostgreSQL. Corruption or unauthorized deletion affects all active sessions.
- **Application secrets and infrastructure config** — `DATABASE_URL`, runtime env vars, and server logging configuration.

## Trust Boundaries

- **Browser to API** — every room operation crosses from an untrusted client to the Express API. The client must be treated as attacker-controlled.
- **API to PostgreSQL** — the API has broad authority over room state. Input validation and authorization must prevent hostile state transitions before writes reach the database.
- **Public internet to shared room** — room codes are shared with collaborators, so possession of a code is a weak capability boundary rather than strong authentication.
- **Participant to participant** — one participant should not be able to act on behalf of another merely by learning identifiers exposed in room state.
- **Production to dev-only tools** — the mockup sandbox and local design/reference files are not part of the production attack surface unless explicitly deployed.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/planningPoker.ts`, `artifacts/planning-poker/src/main.tsx`, `artifacts/planning-poker/src/pages/landing.tsx`, `artifacts/planning-poker/src/pages/room.tsx`
- **Highest-risk area:** planning poker route handlers that mutate groups, participants, teams, stories, and votes based on room keys or client-supplied UUIDs
- **Public surface:** all `/api` planning-poker routes are publicly reachable; there is no separate authenticated/admin surface in current production code
- **Dev-only areas usually ignored:** `artifacts/mockup-sandbox/**`, root-level design/reference files

## Threat Categories

### Spoofing

The main spoofing risk is participant impersonation. Because the app has no account/session authentication, the API must ensure a caller cannot claim another participant identity just by supplying a UUID or by learning identifiers from room state. Room codes may grant room access, but they must not implicitly grant authority to act as any participant.

### Tampering

Attackers can target room state directly: reveal votes early, reset rounds, rename stories, alter team assignments, delete backlog items, or cast fraudulent votes. The server must enforce who is allowed to mutate a room, and every mutation must be bound to the correct room and participant rather than trusting client-supplied identifiers alone.

### Information Disclosure

The API exposes full room state for polling, including participant and story identifiers and vote history references. Responses must avoid disclosing more authority-bearing information than necessary, and endpoints that expose vote history or room state must not become an oracle that enables unauthorized manipulation or scraping of active rooms.

### Denial of Service

Because room collaboration endpoints are public and stateful, attackers may attempt to fill rooms, spam joins, churn rounds, or mass-create stories/teams to disrupt availability. Public endpoints that create or mutate shared state must resist trivial automated abuse.

### Elevation of Privilege

There is no explicit host/admin role, so the critical guarantee is that low-trust capabilities do not silently become high-trust ones. Knowing a room code or participant UUID must not be enough to gain room-wide control, impersonate other participants, or perform destructive actions across a shared room.
