import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API } from "../../utils/api";

const AgentBooking = () => {
  const { alumniId } = useParams();
  const user = JSON.parse(localStorage.getItem("user"));

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingState, setBookingState] = useState(null); // null | 'processing' | 'success' | 'error'
  const [bookingResult, setBookingResult] = useState(null);
  const [query, setQuery] = useState("I'd like to book a mentorship session");
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/student/alumni-slots/${alumniId}`)
      .then(r => r.json())
      .then(data => { setSlots(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [alumniId]);

  const handleAgentBook = async () => {
    if (!selectedSlot) return;
    setBookingState("processing");
    setBookingResult(null);

    try {
      const res = await fetch(`${API}/api/agent/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: user.user_id,
          alumni_id: parseInt(alumniId),
          availability_id: selectedSlot.availability_id,
          query,
        }),
      });

      const data = await res.json();
      setBookingResult(data);
      setBookingState(data.booking?.approved ? "success" : "rejected");
    } catch (err) {
      setBookingState("error");
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", {
    weekday: "short", month: "short", day: "numeric",
  });

  if (loading) return (
    <div className="page">
      <p style={{ opacity: 0.5 }}>Loading available slots...</p>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(102,126,234,0.15)",
          border: "1px solid rgba(102,126,234,0.3)",
          borderRadius: 20,
          padding: "4px 14px",
          fontSize: 12,
          color: "#93c5fd",
          marginBottom: 12,
        }}>
          🤖 Agentic AI Booking
        </div>
        <h2>Book a Session</h2>
        <p style={{ opacity: 0.6, fontSize: 14 }}>
          Claude's agents will validate, match intent, and notify both parties automatically.
        </p>
      </div>

      {/* Session goal input */}
      <div className="card" style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, display: "block" }}>
          💬 What would you like to discuss?
        </label>
        <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 10 }}>
          This helps the AI understand your intent and send the right context to the alumni.
        </p>
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          rows={3}
          placeholder="e.g. I need help with my resume for software engineering roles..."
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff",
            borderRadius: 12,
            padding: "12px 14px",
            fontSize: 14,
            resize: "vertical",
            fontFamily: "Poppins, sans-serif",
            outline: "none",
          }}
        />
      </div>

      {/* Slot selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: "block" }}>
          📅 Select a Time Slot
        </label>

        {slots.length === 0 ? (
          <p style={{ opacity: 0.5 }}>No available slots right now.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {slots.map(slot => (
              <div
                key={slot.availability_id}
                onClick={() => setSelectedSlot(slot)}
                style={{
                  padding: "14px 18px",
                  borderRadius: 14,
                  border: selectedSlot?.availability_id === slot.availability_id
                    ? "2px solid #667eea"
                    : "1px solid rgba(255,255,255,0.15)",
                  background: selectedSlot?.availability_id === slot.availability_id
                    ? "rgba(102,126,234,0.2)"
                    : "rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  minWidth: 150,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(slot.date)}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  {slot.start_time} – {slot.end_time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking result */}
      {bookingResult && (
        <div className="card" style={{
          marginBottom: 20,
          border: bookingState === "success"
            ? "1px solid rgba(74,222,128,0.3)"
            : "1px solid rgba(248,113,113,0.3)",
          background: bookingState === "success"
            ? "rgba(74,222,128,0.08)"
            : "rgba(248,113,113,0.08)",
        }}>
          <h3 style={{ marginBottom: 12 }}>
            {bookingState === "success" ? "✅ Booking Requested!" : "❌ Booking Not Approved"}
          </h3>

          {/* Agent pipeline breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Intent */}
            {bookingResult.intent && (
              <div style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "10px 14px",
              }}>
                <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                  Intent Agent
                </div>
                <div style={{ fontSize: 13 }}>
                  <strong>{bookingResult.intent.intent}</strong> · {bookingResult.intent.summary}
                </div>
                {bookingResult.intent.topics?.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {bookingResult.intent.topics.map(t => (
                      <span key={t} style={{
                        background: "rgba(102,126,234,0.2)",
                        borderRadius: 20,
                        padding: "2px 10px",
                        fontSize: 11,
                        color: "#93c5fd",
                      }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Booking decision */}
            {bookingResult.booking && (
              <div style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "10px 14px",
              }}>
                <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                  Booking Agent
                </div>
                <div style={{ fontSize: 13 }}>
                  <strong>Policy:</strong> {bookingResult.booking.policy} ·{" "}
                  <strong>Confidence:</strong> {bookingResult.booking.confidence}%
                </div>
                <div style={{ fontSize: 13, marginTop: 4, opacity: 0.7 }}>
                  {bookingResult.booking.suggested_message || bookingResult.booking.reason}
                </div>
              </div>
            )}

            {/* Pipeline time */}
            {bookingResult.pipeline_ms && (
              <div style={{ fontSize: 11, opacity: 0.4, textAlign: "right" }}>
                Pipeline: {bookingResult.pipeline_ms}ms
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      {bookingState !== "success" && slots.length > 0 && (
        <button
          className="primary"
          onClick={handleAgentBook}
          disabled={!selectedSlot || bookingState === "processing"}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: 15,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            opacity: !selectedSlot ? 0.5 : 1,
          }}
        >
          {bookingState === "processing" ? (
            <>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span>
              Agents processing...
            </>
          ) : (
            <>🤖 Book with AI Agents</>
          )}
        </button>
      )}

      {bookingState === "success" && (
        <button
          onClick={() => window.location.href = "/student/my-sessions"}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: 15,
            borderRadius: 14,
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          View My Sessions →
        </button>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
};

export default AgentBooking;
