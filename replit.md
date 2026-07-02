# Planning Poker

A real-time-feeling agile estimation tool where teams create a room and vote together on story points with instant reveal and consensus stats.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000/8080)
- `pnpm --filter @workspace/planning-poker run dev` — run the frontend (Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + wouter + TanStack Query
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract (Room, Group, Participant, ParticipantState, RoomState schemas + all endpoints)
- `lib/db/src/schema/planningPoker.ts` — DB schema: rooms, groups, participants, votes
- `artifacts/api-server/src/routes/planningPoker.ts` — all business logic routes
- `artifacts/planning-poker/` — frontend (landing page at `/`, room UI at `/room/:key`)

## Architecture decisions

- "Real-time" feel is achieved via polling (`useGetRoomState` with `refetchInterval: 2000`), not websockets — simpler to build and sufficient for this use case.
- Every room has exactly one shared voting `groups` row, auto-created server-side when the room is created (`POST /rooms`) and auto-assigned to every participant on join (`POST /rooms/:key/join`). There is no user-facing concept of multiple tables/breakout groups — the `groups` table is an internal implementation detail carried over from an earlier design, kept as a single row per room to avoid a schema migration.
- "Groups" in the UI (the "Manage groups" feature) are a SEPARATE concept from the internal `groups` voting table. They map to the `teams` table (`participants.teamId` FK, nullable, set null on delete). A participant belongs to at most one team. Teams are purely for organizing how votes are DISPLAYED — everyone still votes on the same shared story, and there is NO per-group averaging. On reveal, each participant's vote is shown grouped under their team (plus an "Ungrouped" bucket); the overall average/consensus is unchanged. Team color is auto-assigned round-robin from a fixed palette (see `TEAM_COLORS` server-side / `TEAM_COLOR_CLASSES` client-side).
- Participant identity is persisted in `localStorage` (see `src/lib/storage.ts`) so refreshing the page keeps you in the room without re-joining.
- Room capacity capped at 20 participants, enforced server-side on join (400 with friendly error).
- Votes are keyed by `(groupId, participantId, round)` so re-voting updates in place, and starting a new story/round naturally clears old votes without deleting history.
- Vote history: each vote row is tagged with the active story's id (`votes.storyId`, nullable FK, cascade on story delete — nullable because votes cast before this feature existed have no story). `GET /stories/:storyId/votes` returns the recorded votes for a story (latest round per participant, joined with participant name + teamId, plus average/allSame). In the room UI, clicking a "Done" backlog card opens a dialog (`historyStoryId` state + `useGetStoryVotes`) showing those votes grouped by team + "Ungrouped", mirroring the reveal display. Old votes cast before the schema change have `storyId=null` so their history is empty.
- Room UI (`artifacts/planning-poker/src/pages/room.tsx`) uses a focused single-table layout: dark header, left "Waiting"/"Voted" participant lists (not table lists), center ticket bar + avatar grid around a "Reveal votes" panel, right ticket-style backlog panel with a search bar, and a fixed bottom "Choose your card" dock.
- Light/dark theming uses `next-themes` (already a dep via the shadcn `sonner` component). `App.tsx` wraps everything in `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>`, so the `.dark` class on `<html>` drives the theme and the choice persists in localStorage. `src/index.css` holds LIGHT color tokens in `:root` and DARK tokens (the original palette, plus the `rgba(255,255,255,...)` elevate/outline tuples) in `.dark`. A `ThemeToggle` (Sun/Moon icon button, `src/components/theme-toggle.tsx`) sits top-right in both the room header and the landing page. Any new colored UI must use semantic tokens (`text-foreground`, `bg-muted`, etc.) or dual classes (`text-*-700 dark:text-*-300`) — never bare dark-tuned utilities like `text-white` or `text-*-300`, which break light mode.

## Product

- Create a room (get a shareable 6-character room code) or join an existing one by code.
- Inside a room, everyone votes together at one shared table: set the current story title, vote with a Fibonacci-like card deck, reveal votes (with average + consensus check), and reset for the next round.
- Left sidebar shows who's still "Waiting" to vote vs. who has "Voted" for the current story.
- Live participant count vs. the 20-person room cap.
- The room has a story backlog: import a CSV of story titles (e.g. exported from Jira — looks for a "Summary"/"Title"/"Story"/"Name" column, else falls back to the first column), then click "Start voting" on a backlog item to make it the active voting story. Starting a new story auto-marks the previous active story "done" and records its final estimate (average of revealed votes, if any).
- No native Jira API integration (third-party connectors require a paid plan on this tier) — CSV export/import is the supported Jira workflow.

## User preferences

_None recorded yet._

## Gotchas

- After changing `lib/db/src/schema`, run `pnpm run typecheck:libs` before typechecking `api-server`, or stale `.tsbuildinfo`/declarations will show false "no exported member" errors.
- Orval-generated `useGetRoomState` requires an explicit `queryKey` (via `getGetRoomStateQueryKey`) when passing `query` options like `refetchInterval`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
