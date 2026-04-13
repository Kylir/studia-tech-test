# `getAvailableSessions`

Returns a tutor's upcoming sessions that still have open capacity.

## Location

`src/server/routers/session.ts` — `sessionRouter.getAvailableSessions`

## Input

| Field | Type | Description |
|---|---|---|
| `tutorId` | `string` | ID of the tutor whose sessions to fetch |

## Output

Array of session objects, ordered by `startsAt` ascending:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Session ID |
| `title` | `string` | Session title |
| `startsAt` | `DateTime` | Session start time |
| `endsAt` | `DateTime` | Session end time |
| `capacity` | `number` | Total capacity |
| `spotsRemaining` | `number` | Available spots |
| `tutorName` | `string` | Tutor's display name |
| `tutorSubject` | `string` | Tutor's subject |

## Business Rules

- Only sessions in the future (`startsAt > now`) are returned
- Only sessions with at least one spot remaining are returned
- Capacity is calculated from **confirmed bookings only** — cancelled bookings do not count

## Implementation Notes

Prisma cannot compare an aggregate count against another column on the same row in a `where` clause (e.g. `bookingCount < session.capacity`). The query therefore fetches all future sessions with their confirmed bookings included, then filters and maps in application code.

```ts
const sessions = await ctx.prisma.session.findMany({
  where: {
    tutorId: input.tutorId,
    startsAt: { gt: new Date() },
  },
  include: {
    tutor: true,
    bookings: { where: { status: "confirmed" } },
  },
  orderBy: { startsAt: "asc" },
});

return sessions
  .filter((s) => s.bookings.length < s.capacity)
  .map((s) => ({ ...spotsRemaining: s.capacity - s.bookings.length, ... }));
```
