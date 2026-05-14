# brix Scheduling Platform

A service scheduling and notification system where managers assign quotes to technicians, with backend-enforced conflict prevention and automatic notifications.

---

## Quick Start

```bash
npm install
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app opens to the manager dashboard. Use the **Manager / Technician** tab in the header to switch views, and the **Hi, [name] ▾** dropdown to switch between seeded users (2 managers, 3 technicians).

---

## What's Built

### Manager view
- Grid of unscheduled quotes ready to be assigned
- **Assign Job** opens a modal: pick a technician, date, and 30-minute start slot
- Taken time slots are greyed out and disabled — no manual conflict hunting required
- Notification bell shows when technicians complete jobs; mark all as read in one click

### Technician view
- Upcoming and completed jobs with full date/time and description
- **Mark Complete** shows a confirmation popup before firing — prevents accidental double-clicks
- Notification bell shows new job assignments with timestamps

> **Note:** Quotes are pre-seeded to represent work orders already in the system. The brief specifies *viewing and assigning* quotes — creation is intentionally out of scope. In production this would come from the brix quoting flow.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 App Router + TypeScript | Matches brix's production frontend exactly |
| API | Next.js API routes | brix uses Go, but fighting Go's type system in a 3–5hr window costs more than the problem. Acknowledged below. |
| ORM | Prisma v5 | One config line from MySQL (brix's DB). v7 has breaking changes; v5 is stable. |
| Database | SQLite | Zero Docker setup for reviewer. Relational model fits FK-heavy data. Trivial to swap. |
| Styling | Tailwind v4 | Brand tokens defined once in `@theme`, propagate as utility classes everywhere. |

**On not using Go:** brix uses Go in production. In a time-boxed assessment I made the call that shipping a correct, readable solution in a familiar environment was more valuable than fighting an unfamiliar language. In production I'd extract these API routes into a standalone Go service.

**On not using MongoDB:** My daily driver at Ladder. But this problem has FK relationships everywhere — quotes belong to managers, jobs join four tables, conflict queries need transactions. SQL is the right tool.

**Switching to MySQL:** Change `provider = "sqlite"` to `provider = "mysql"` in `prisma/schema.prisma` and update `DATABASE_URL` in `.env`. No schema changes needed — Prisma handles the rest.

---

## Conflict Prevention

This is the core of the assessment.

### The overlap condition

A new job `[newStart, newEnd)` conflicts with an existing job `[existingStart, existingEnd)` when:

```
existingStart < newEnd  AND  existingEnd > newStart
```

This single condition handles all three cases — partial overlap at the front, partial overlap at the back, and full containment in either direction.

### The race condition problem

A naive check-then-create has a window where two simultaneous requests both pass the conflict check before either writes:

```
Request A: check (no conflict found) → ...
Request B: check (no conflict found) → ...
Request A: create job ✅
Request B: create job ✅  ← double-booking
```

### The transaction solution

The conflict check and job creation are wrapped in a single `prisma.$transaction()`:

```ts
await prisma.$transaction(async (tx) => {
  const conflict = await tx.job.findFirst({
    where: {
      technicianId,
      status: "SCHEDULED",
      scheduledStart: { lt: scheduledEnd },
      scheduledEnd:   { gt: scheduledStart },
    },
  });
  if (conflict) throw new Error("CONFLICT");

  await tx.job.create({ ... });            // create job
  await tx.quote.update({ ... });          // mark quote SCHEDULED
  await tx.notification.create({ ... });   // notify technician
});
```

The check and write are a single atomic unit. SQLite allows only one writer at a time — if two requests arrive simultaneously, SQLite queues the second until the first commits. The second transaction then sees the newly-created job and correctly throws a conflict.

As a second safety net, Prisma throws `P2034` on write contention, which the route catches and returns as a 409.

**In production with MySQL:** the transaction would use `SELECT ... FOR UPDATE` to acquire a row-level lock before the check, preventing any other transaction from reading the technician's schedule until the first commits.

### Availability API

`GET /api/availability?technicianId=xxx&date=YYYY-MM-DD`

Returns the 30-minute start slots that would produce a conflict for a 2-hour job. Instead of integer-hour arithmetic, it iterates every 30-min slot and runs the exact same overlap condition:

```ts
const slotStart = /* e.g. 10:00 */;
const slotEnd = slotStart + 2hrs;   // 12:00
const blocked = jobs.some(j => slotStart < j.scheduledEnd && slotEnd > j.scheduledStart);
```

This correctly handles non-hour-aligned jobs — a job starting at 8:31am blocks the 7:00, 7:30, 8:00, and 8:30 start slots, not just the integer-hour overlaps simpler arithmetic would produce.

---

## Notifications

DB-based polling — the frontend polls `/api/notifications` every 5 seconds. Simple, transparent, and sufficient for assessment scope.

**Why not SSE/WebSockets for this submission:** The brief says "can be simulated." Polling is explicit and easy to follow in a code review. For production: Server-Sent Events would be the right next step — a persistent HTTP stream, no WebSocket handshake complexity, native browser support, works through most proxies.

---

## Data Model

```
Manager      ─── has many ──→ Quote, Job, Notification
Technician   ─── has many ──→ Job, Notification
Quote        ─── has one  ──→ Job  (@unique constraint)
Job          ─── has many ──→ Notification
Notification ─── belongs to ──→ Technician | Manager  (recipientType field)
```

`Job.quoteId` is `@unique` at the database level — two jobs cannot reference the same quote even if application logic fails.

`scheduledEnd` is always `scheduledStart + 2 hours`. The UI only sends a start time; the API calculates and stores the end time. This is enforced server-side and never exposed as an editable input.

**No enums:** SQLite doesn't support them. Used `String` fields in the schema with TypeScript string literal unions (`"SCHEDULED" | "COMPLETED"`) for compile-time safety.

---

## No Auth

Standard assessment shortcut. The **Hi, [name] ▾** dropdown lets the reviewer switch between seeded users without a login flow. In production this would be session-based auth — the switcher would be removed entirely.

---

## What I'd Do Next

- **Go backend** — extract API routes into a standalone Go service to match brix's production architecture
- **MySQL** — swap `DATABASE_URL` + add `SELECT ... FOR UPDATE` for row-level locking in the conflict transaction
- **SSE notifications** — replace polling with a Server-Sent Events stream; persistent connection, no interval overhead
- **Auth** — JWT or session-based; remove the demo user switcher
- **Quote creation** — let managers create quotes in-app; right now they're seeded
- **Optimistic UI** — hide assigned quotes from the manager grid immediately before the API responds
