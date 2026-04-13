# `bookSession`

Books a student into a session, with validation and re-booking support.

## Location

`src/server/routers/session.ts` — `sessionRouter.bookSession`

## Input

| Field | Type | Description |
|---|---|---|
| `studentId` | `string` | ID of the student booking the session |
| `sessionId` | `string` | ID of the session to book |
| `notes` | `string?` | Optional notes for the booking |

## Output

The created or updated `Booking` record, including the related `Session`.

## Business Rules

- The session must exist
- The session must be in the future (`startsAt > now`)
- The session must not be fully booked (confirmed bookings only count toward capacity)
- A student cannot have two confirmed bookings for the same session
- If a student previously cancelled their booking for a session, they are allowed to re-book

## Error Cases

| Condition | Error message |
|---|---|
| Session not found | `"Session not found"` |
| Session is in the past | `"Session is in the past"` |
| Session is fully booked | `"Session is fully booked"` |
| Student has an existing confirmed booking | `"Student already has a confirmed booking for this session"` |

## Implementation Notes

The `Booking` model has a `@@unique([studentId, sessionId])` constraint, which means a plain `create` would throw a unique constraint violation when a student re-books after cancelling. An `upsert` is used instead, handling both paths with a single operation:

- **New booking** (no existing record): inserts a confirmed booking
- **Re-booking** (cancelled record exists): updates status back to confirmed

```ts
return ctx.prisma.booking.upsert({
  where: { studentId_sessionId: { studentId, sessionId } },
  create: { studentId, sessionId, notes, status: "confirmed" },
  update: { status: "confirmed", notes },
  include: { session: true },
});
```
