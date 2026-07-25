# Job Scheduler

A scheduling tool that lets managers assign quotes to technicians, prevent double-bookings, and keep both sides notified as work moves through the pipeline.

---

## Quick Start

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app opens to the manager dashboard. Use the **Manager / Technician** tab in the header to switch views, and the name chips below the greeting to switch between seeded users (2 managers, 3 technicians).

---

## What's Built

### Manager view

- Grid of unscheduled quotes ready to be assigned
- **Assign Job** opens a modal: pick a technician, date, and 30-minute start slot
- Taken time slots are greyed out and disabled. No manual conflict hunting required
- Notification bell shows when technicians complete jobs; mark all as read in one click

### Technician view

- Upcoming and completed jobs with full date/time and description
- **Mark Complete** shows a confirmation popup before firing to prevent accidental double-clicks
- Notification bell shows new job assignments with timestamps

> **Note:** Quotes represent work orders already in the system. They are pre-seeded so this repo can focus on the viewing and assigning flow. In production these would come through an upstream quoting pipeline.

---

## Stack

| Layer    | Choice                             | Why                                                                                                                                                                        |
| -------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | Next.js 14 App Router + TypeScript | React and TypeScript are my main stack. Next.js was a natural fit — App Router, file-based routing, TypeScript first-class.                                                |
| API      | Next.js API routes                 | Keeps everything in one project — no separate backend process, no port juggling. Routes share the same TypeScript types as the frontend.                                   |
| ORM      | Prisma v5                          | Clean Developer Experience. We define a schema, run a migration, get a fully typed client. Works great with TypeScript. v5 over v7 because v7 introduced breaking changes. |
| Database | SQLite                             | No Docker or separate process needed. The data is FK-heavy which SQL handles well. Easy to swap for MySQL, which is more standard for production.                          |
| Styling  | Tailwind v4                        | Brand tokens defined once in `@theme`, propagate as utility classes everywhere.                                                                                            |

**On not using Go:** I considered Go for the API layer but made the call that shipping a correct, readable solution in a familiar environment was more valuable than fighting an unfamiliar language for a project this size. If this ever needed to scale past a single Next.js project, I'd extract these API routes into a standalone Go service.

You can switch to MySQL by changing `provider = "sqlite"` to `provider = "mysql"` in `prisma/schema.prisma` and updating `DATABASE_URL` in `.env`. No schema changes needed as Prisma handles the rest.

---

## Conflict Prevention

This is the core of the app.

### The overlap condition

A new job `[newStart, newEnd)` conflicts with an existing job `[existingStart, existingEnd)` when:

```
existingStart < newEnd  AND  existingEnd > newStart
```

This single condition handles all three cases. Partial overlap at the front, partial overlap at the back, and full containment in either direction.

### The race condition problem

A naive check-then-create has a gap where two requests both pass the conflict check before either one writes to the database. Both see no conflict, both create a job, and the technician ends up double-booked.

### The transaction solution

The conflict check and job creation are wrapped in a single transaction. This means the check and the write happen as one unit with nothing able to slip in between them.

SQLite only allows one write at a time, so if two requests come in together, the second one waits until the first finishes. By the time the second one runs its check, the first job already exists and the conflict is caught correctly.

As a backup, if two requests do collide at the exact same millisecond, Prisma detects the write collision and the route catches it and returns a 409 conflict response.

### Availability API

`GET /api/availability?technicianId=xxx&date=YYYY-MM-DD`

Returns which time slots are already taken for a given technician on a given day. The assign modal uses this to grey out unavailable slots before the manager even tries to book.

Slots are checked in 30-minute intervals. Each slot is tested against the same overlap condition used in the conflict check, so the two are always in sync. This also handles edge cases correctly, for example a job starting at 8:31am will correctly block the 8:00 and 8:30 slots, not just the nearest round hour.

## Notifications

DB-based polling — the frontend polls `/api/notifications` every 5 seconds. Simple, transparent, and sufficient for this scope.

**Why not SSE/WebSockets:** The frontend checks for new notifications every 5 seconds. Simple, easy to follow, and does the job for this scope. For production the better approach would be Server-Sent Events, where the server pushes updates to the browser the moment something happens instead of the browser asking repeatedly. No unnecessary requests, no delay between the event and the notification appearing.

---

## Data Model

There are 5 tables (Manager, Technician, Quote, Job, Notification). A Manager creates Quotes and assigns Jobs. A Technician gets assigned those Jobs. Each Quote can only have one Job linked to it, enforced at the database level so it is impossible to assign the same quote twice even if something goes wrong in the application. Notifications are sent to either a Technician or a Manager depending on what happened, tracked with a recipient type field.

`scheduledEnd` is always `scheduledStart + 2 hours`. The UI only sends a start time and the API calculates the end time server-side.

**No enums:** SQLite does not support them. Status fields are stored as strings in the database with TypeScript string literal types providing the same safety at the code level.

## No Auth

To make it easier to try both flows, there is a user switcher in the header that lets one jump between the seeded managers and technicians without a login screen. In production this would be replaced with proper session-based auth and the switcher would be removed entirely.

---

## What I'd Do Next

- **Auth** — session-based auth so managers and technicians have their own accounts; removes the need for the switcher
- **Richer job details** — add fields like job notes, priority level, estimated duration, and customer contact info so technicians have everything they need before arriving on site
- **Job acceptance** — let technicians accept or decline a job before it is confirmed, so managers know the job is actually covered
- **SSE notifications** — replace polling with Server-Sent Events so notifications arrive instantly rather than on a polling interval
- **Quote creation** — let managers create and manage quotes inside the app rather than relying on seeded data
- **Optimistic UI** — remove an assigned quote from the manager grid immediately when assigned rather than waiting for the API to respond
- **Production database** — swap SQLite for MySQL; Prisma makes this a one line config change
