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

  const { data: sessions, isLoading, error, refetch } = trpc.session.getAvailableSessions.useQuery(
    { tutorId },
    { enabled: !!tutorId }
  );

  const bookSession = trpc.session.bookSession.useMutation({
    onSuccess: () => {
      refetch();
      setBookingSessionId(null);
    },
    onError: () => {
      setBookingSessionId(null);
    },
  });

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
              isBooking={bookingSessionId === session.id}
              onBook={() => handleBook(session.id)}
            />
          ))
      }
    </main>
  );
}
