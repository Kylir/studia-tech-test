# `cancelBooking`

Soft-cancels a confirmed booking by setting its status to `"cancelled"`.

## Location

`src/server/routers/session.ts` — `sessionRouter.cancelBooking`

## Input

| Field | Type | Description |
|---|---|---|
| `bookingId` | `string` | ID of the booking to cancel |

## Output

The updated `Booking` record with status `"cancelled"`.

## Business Rules

- The booking must exist
- The booking must currently be `"confirmed"` — already-cancelled bookings cannot be cancelled again
- The session must not have started yet (`startsAt > now`)
- The record is never deleted — status is set to `"cancelled"` to preserve history and allow re-booking

## Error Cases

| Condition | Error message |
|---|---|
| Booking not found | `"Booking not found"` |
| Booking is already cancelled | `"Booking is already cancelled"` |
| Session has already started | `"Session has already started"` |

## Implementation Notes

The booking is fetched with its session included so that `session.startsAt` is available for the time check. A single `update` then sets the status.

```ts
const booking = await ctx.prisma.booking.findUnique({
  where: { id: input.bookingId },
  include: { session: true },
});

// ... validation ...

return ctx.prisma.booking.update({
  where: { id: input.bookingId },
  data: { status: "cancelled" },
});
```

Soft deletion (rather than hard delete) is intentional: `bookSession` relies on the cancelled record existing so it can upsert it back to `"confirmed"` when a student re-books.
