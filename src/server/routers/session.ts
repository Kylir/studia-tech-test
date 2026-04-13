import { z } from "zod";
import { router, publicProcedure } from "../trpc";

/**
 * ============================================================
 *  SESSION ROUTER — YOUR TASK
 * ============================================================
 *
 *  Implement the four tRPC procedures below. Each procedure has:
 *    - A description of what it should do
 *    - The expected input schema (already defined)
 *    - Hints about edge cases to handle
 *
 *  The Prisma client is available via `ctx.prisma`.
 *  Refer to prisma/schema.prisma for the data model.
 *
 *  Run `npm test` to check your progress — all tests should pass.
 * ============================================================
 */

export const sessionRouter = router({
  /**
   * PROCEDURE 1: getAvailableSessions
   *
   * Return a tutor's FUTURE sessions that still have available capacity.
   *
   * Requirements:
   *   - Only return sessions where startsAt is in the future
   *   - Only return sessions that are NOT fully booked
   *   - A session's booked count should only include "confirmed" bookings
   *     (cancelled bookings do NOT count towards capacity)
   *   - Include the tutor's name and subject in the response
   *   - Include how many spots remain for each session
   *   - Order results by startsAt ascending (soonest first)
   */
  getAvailableSessions: publicProcedure
    .input(
      z.object({
        tutorId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.prisma.session.findMany({
        where: {
          tutorId: input.tutorId,
          startsAt: { gt: new Date() },
        },
        include: {
          tutor: true,
          bookings: {
            where: { status: "confirmed" },
          },
        },
        orderBy: { startsAt: "asc" },
      });

      return sessions
        .filter((s) => s.bookings.length < s.capacity)
        .map((s) => ({
          id: s.id,
          title: s.title,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          capacity: s.capacity,
          spotsRemaining: s.capacity - s.bookings.length,
          tutorName: s.tutor.name,
          tutorSubject: s.tutor.subject,
        }));
    }),

  /**
   * PROCEDURE 2: bookSession
   *
   * Book a student into a session.
   *
   * Requirements:
   *   - Validate the session exists and is in the future
   *   - Validate the session is not fully booked (confirmed bookings only)
   *   - Prevent duplicate bookings (same student + same session)
   *     BUT: if the student previously cancelled, allow them to re-book
   *   - Return the created booking with session details
   *
   * Error handling — throw descriptive errors for:
   *   - Session not found
   *   - Session is in the past
   *   - Session is fully booked
   *   - Student already has a confirmed booking for this session
   */
  bookSession: publicProcedure
    .input(
      z.object({
        studentId: z.string(),
        sessionId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.session.findUnique({
        where: { id: input.sessionId },
        include: {
          bookings: { where: { status: "confirmed" } },
        },
      });

      if (!session) throw new Error("Session not found");
      if (session.startsAt <= new Date()) throw new Error("Session is in the past");
      if (session.bookings.length >= session.capacity) throw new Error("Session is fully booked");

      const existing = await ctx.prisma.booking.findUnique({
        where: {
          studentId_sessionId: {
            studentId: input.studentId,
            sessionId: input.sessionId,
          },
        },
      });

      if (existing?.status === "confirmed") throw new Error("Student already has a confirmed booking for this session");

      return ctx.prisma.booking.upsert({
        where: {
          studentId_sessionId: {
            studentId: input.studentId,
            sessionId: input.sessionId,
          },
        },
        create: {
          studentId: input.studentId,
          sessionId: input.sessionId,
          notes: input.notes,
          status: "confirmed",
        },
        update: {
          status: "confirmed",
          notes: input.notes,
        },
        include: { session: true },
      });
    }),

  /**
   * PROCEDURE 3: cancelBooking
   *
   * Cancel an existing booking.
   *
   * Requirements:
   *   - Find the booking by ID
   *   - Only allow cancellation if the booking status is "confirmed"
   *   - Only allow cancellation if the session hasn't started yet
   *   - Set the booking status to "cancelled" (do NOT delete it)
   *   - Return the updated booking
   *
   * Error handling — throw descriptive errors for:
   *   - Booking not found
   *   - Booking is already cancelled
   *   - Session has already started or passed
   */
  cancelBooking: publicProcedure
    .input(
      z.object({
        bookingId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: { session: true },
      });

      if (!booking) throw new Error("Booking not found");
      if (booking.status === "cancelled") throw new Error("Booking is already cancelled");
      if (booking.session.startsAt <= new Date()) throw new Error("Session has already started");

      return ctx.prisma.booking.update({
        where: { id: input.bookingId },
        data: { status: "cancelled" },
      });
    }),

  /**
   * PROCEDURE 4: getStudentBookings
   *
   * Return all bookings for a given student.
   *
   * Requirements:
   *   - Include session details (title, startsAt, endsAt) and tutor name
   *   - Include the booking status
   *   - Order by session startsAt descending (most recent first)
   *   - Optionally filter by status if provided
   */
  getStudentBookings: publicProcedure
    .input(
      z.object({
        studentId: z.string(),
        status: z.enum(["confirmed", "cancelled"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const bookings = await ctx.prisma.booking.findMany({
        where: {
          studentId: input.studentId,
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          session: {
            include: { tutor: true },
          },
        },
        orderBy: {
          session: { startsAt: "desc" },
        },
      });

      return bookings.map((b) => ({
        id: b.id,
        studentId: b.studentId,
        sessionId: b.sessionId,
        status: b.status,
        notes: b.notes,
        session: {
          title: b.session.title,
          startsAt: b.session.startsAt,
          endsAt: b.session.endsAt,
        },
        tutorName: b.session.tutor.name,
      }));
    }),
});
