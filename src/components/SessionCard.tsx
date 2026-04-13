// ABOUTME: Card component for displaying a single tutoring session.
// ABOUTME: Handles available, full, already-booked, and booking-in-progress states.

import React from "react";

interface SessionCardProps {
  title: string;
  startsAt: Date;
  endsAt: Date;
  spotsRemaining: number;
  isBooked: boolean;
  isBooking: boolean;
  isCancelling: boolean;
  onBook: () => void;
  onCancel: () => void;
}

export default function SessionCard({
  title,
  startsAt,
  endsAt,
  spotsRemaining,
  isBooked,
  isBooking,
  isCancelling,
  onBook,
  onCancel,
}: SessionCardProps) {
  const isFull = spotsRemaining === 0;

  const dateStr = startsAt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const timeStr = `${startsAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} – ${endsAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className="p-4 border border-gray-300 rounded-lg mb-4">
      <strong>{title}</strong>
      <p className="text-gray-500 mt-1">{dateStr} · {timeStr}</p>
      <p className="text-gray-500">
        {isFull ? "No spots remaining" : `${spotsRemaining} spot${spotsRemaining === 1 ? "" : "s"} remaining`}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onBook}
          disabled={isFull || isBooked || isBooking}
          className="px-4 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBooking ? "Booking…" : isBooked ? "Booked" : isFull ? "Full" : "Book"}
        </button>
        {isBooked && (
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="px-4 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? "Cancelling…" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}
