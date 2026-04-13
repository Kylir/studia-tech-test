// ABOUTME: Page listing available sessions for a given tutor.
// ABOUTME: Allows a student to book a session via the bookSession mutation.

import { useState } from "react";
import { useRouter } from "next/router";
import { trpc } from "~/utils/trpc";
import SessionCard from "~/components/SessionCard";

const STUDENT_ID = "student-01";

export default function TutorSessionsPage() {
  const router = useRouter();
  const tutorId = router.query.tutorId as string;
  const [bookingSessionId, setBookingSessionId] = useState<string | null>(null);
  const [cancellingSessionId, setCancellingSessionId] = useState<string | null>(null);

  const { data: sessions, isLoading, error, refetch } = trpc.session.getAvailableSessions.useQuery(
    { tutorId },
    { enabled: !!tutorId }
  );

  const { data: myBookings, refetch: refetchMyBookings } = trpc.session.getStudentBookings.useQuery(
    { studentId: STUDENT_ID, status: "confirmed" },
    { enabled: !!tutorId }
  );

  const bookedSessionIds = new Set(myBookings?.map((b) => b.sessionId) ?? []);
  const bookingIdBySessionId = new Map(myBookings?.map((b) => [b.sessionId, b.id]) ?? []);

  const bookSession = trpc.session.bookSession.useMutation({
    onSuccess: () => {
      refetch();
      refetchMyBookings();
      setBookingSessionId(null);
    },
    onError: () => {
      setBookingSessionId(null);
    },
  });

  const cancelBooking = trpc.session.cancelBooking.useMutation({
    onSuccess: () => {
      refetch();
      refetchMyBookings();
      setCancellingSessionId(null);
    },
    onError: () => {
      setCancellingSessionId(null);
    },
  });

  const handleCancel = (sessionId: string) => {
    const bookingId = bookingIdBySessionId.get(sessionId);
    if (!bookingId) return;
    setCancellingSessionId(sessionId);
    cancelBooking.mutate({ bookingId });
  };

  const handleBook = (sessionId: string) => {
    setBookingSessionId(sessionId);
    bookSession.mutate({ studentId: STUDENT_ID, sessionId });
  };

  if (isLoading) return <main className="max-w-xl mx-auto p-8 font-sans"><p className="text-gray-500">Loading sessions…</p></main>;
  if (error) return <main className="max-w-xl mx-auto p-8 font-sans"><p className="text-gray-500">Error: {error.message}</p></main>;

  return (
    <main className="max-w-xl mx-auto p-8 font-sans">
      <h1 className="mb-1">Available Sessions</h1>
      {sessions?.length === 0
        ? <p className="text-gray-500">No sessions available.</p>
        : sessions?.map((session) => (
            <SessionCard
              key={session.id}
              title={session.title}
              startsAt={new Date(session.startsAt)}
              endsAt={new Date(session.endsAt)}
              spotsRemaining={session.spotsRemaining}
              isBooked={bookedSessionIds.has(session.id)}
              isBooking={bookingSessionId === session.id}
              isCancelling={cancellingSessionId === session.id}
              onBook={() => handleBook(session.id)}
              onCancel={() => handleCancel(session.id)}
            />
          ))
      }
    </main>
  );
}
