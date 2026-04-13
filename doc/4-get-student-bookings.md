# `getStudentBookings`

Returns all bookings for a given student, with session and tutor details.

## Location

`src/server/routers/session.ts` — `sessionRouter.getStudentBookings`

## Input

| Field | Type | Description |
|---|---|---|
| `studentId` | `string` | ID of the student whose bookings to fetch |
| `status` | `"confirmed" \| "cancelled"` (optional) | Filter by booking status |

## Output

Array of booking objects, ordered by session `startsAt` descending (most recent first):

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Booking ID |
| `studentId` | `string` | Student ID |
| `sessionId` | `string` | Session ID |
| `status` | `string` | Booking status (`"confirmed"` or `"cancelled"`) |
| `notes` | `string?` | Optional booking notes |
| `session.title` | `string` | Session title |
| `session.startsAt` | `DateTime` | Session start time |
| `session.endsAt` | `DateTime` | Session end time |
| `tutorName` | `string` | Tutor's display name (flattened from session → tutor) |

## Business Rules

- Returns all bookings for the student if no status filter is provided
- When `status` is provided, only bookings with that status are returned
- Results are ordered by session start time, most recent first

## Implementation Notes

Requires two levels of relation traversal (`Booking → Session → Tutor`) to retrieve the tutor name. Prisma supports ordering by a nested relation field directly, so no application-level sort is needed.

`tutorName` is returned as a flat field on each result (rather than nested under `session.tutor`) to match the shape used by `getAvailableSessions`.

```ts
const bookings = await ctx.prisma.booking.findMany({
  where: {
    studentId: input.studentId,
    ...(input.status ? { status: input.status } : {}),
  },
  include: {
    session: { include: { tutor: true } },
  },
  orderBy: {
    session: { startsAt: "desc" },
  },
});
```
