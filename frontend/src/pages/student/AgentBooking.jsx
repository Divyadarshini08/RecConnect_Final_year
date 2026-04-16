import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";

const AgentBooking = () => {
  const { alumniId } = useParams();
  const navigate = useNavigate();
  const user = useAuth();

  const [slots, setSlots] = useState([]);
  const [alumniName, setAlumniName] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingState, setBookingState] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [query, setQuery] = useState("I'd like to book a mentorship session");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const slotRes = await fetch(`${API}/api/student/alumni-slots/${alumniId}`);
        const slotData = await slotRes.json();
        setSlots(slotData);

        const profileRes = await fetch(`${API}/api/alumni/profile/${alumniId}`);
        const profileData = await profileRes.json();
        setAlumniName(profileData.name || "Alumni");
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load available slots");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [alumniId]);

  const handleAgentBook = async () => {
    if (!selectedSlot) {
      setError("Please select a time slot");
      return;
    }
    setBookingState("processing");
    setBookingResult(null);
    setError(null);

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
      if (data.booking?.approved || data.success) {
        setBookingState("success");
        setTimeout(() => navigate("/student/dashboard"), 2000);
      } else {
        setBookingState("rejected");
      }
    } catch (err) {
      setError("Failed to send booking request");
      setBookingState("error");
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) return (
    <div className="page" style={{ textAlign: "center", paddingTop: "60px" }}>
      <p style={{ opacity: 0.6 }}>Loading available slots...</p>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(59, 130, 246, 0.15)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "20px",
          padding: "6px 16px",
          fontSize: "12px",
          color: "#93c5fd",
          marginBottom: "12px",
          fontWeight: "600",
        }}>
          🤖 AI-Powered Booking
        </div>
        <h2 style={{ marginBottom: "8px" }}>AI-Matched with {alumniName}</h2>
        <p style={{ opacity: 0.6, fontSize: "15px" }}>
          Claude's agents will validate intent, find the best fit, and automate notifications.
        </p>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px",
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "8px",
          color: "#fca5a5",
          marginBottom: "20px",
          fontSize: "14px",
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Session goal input */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <label style={{ fontWeight: "600", fontSize: "14px", marginBottom: "8px", display: "block", color: "#e5e7eb" }}>
          💬 What would you like to discuss?
        </label>
        <p style={{ fontSize: "12px", opacity: "0.5", marginBottom: "10px" }}>
          Claude will understand your intent and provide matching context.
        </p>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          placeholder="e.g. I need help with my resume for software engineering roles..."
          style={{
            width: "100%",
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#fff",
            borderRadius: "8px",
            padding: "12px 14px",
            fontSize: "14px",
            resize: "vertical",
            fontFamily: "Poppins, sans-serif",
            outline: "none",
          }}
          onFocus={(e) => {
            e.target.style.background = "rgba(0, 0, 0, 0.4)";
            e.target.style.borderColor = "rgba(59, 130, 246, 0.5)";
          }}
          onBlur={(e) => {
            e.target.style.background = "rgba(0, 0, 0, 0.3)";
            e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
          }}
        />
      </div>

      {/* Slot selector */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <label style={{ fontWeight: "600", fontSize: "14px", marginBottom: "12px", display: "block", color: "#e5e7eb" }}>
          📅 Available Time Slots
        </label>

        {slots.length === 0 ? (
          <div style={{
            padding: "40px 20px",
            textAlign: "center",
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: "8px",
            border: "1px dashed rgba(255, 255, 255, 0.1)",
          }}>
            <p style={{ opacity: 0.5 }}>No available slots right now</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}>
            {slots.map((slot) => (
              <div
                key={slot.availability_id}
                onClick={() => setSelectedSlot(slot)}
                style={{
                  padding: "14px 16px",
                  background: selectedSlot?.availability_id === slot.availability_id
                    ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))"
                    : "rgba(0, 0, 0, 0.2)",
                  border: selectedSlot?.availability_id === slot.availability_id
                    ? "2px solid #3b82f6"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#93c5fd", marginBottom: "4px" }}>
                  {formatDate(slot.date)}
                </div>
                <div style={{ fontSize: "14px", fontWeight: "500", color: "#e5e7eb" }}>
                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book Button */}
      <button
        onClick={handleAgentBook}
        disabled={bookingState === "processing" || !selectedSlot}
        style={{
          width: "100%",
          padding: "12px 20px",
          background: bookingState === "processing"
            ? "linear-gradient(135deg, #64748b, #475569)"
            : "linear-gradient(135deg, #3b82f6, #2563eb)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "15px",
          fontWeight: "600",
          cursor: bookingState === "processing" ? "not-allowed" : "pointer",
          transition: "all 0.3s ease",
          boxShadow: bookingState === "processing"
            ? "none"
            : "0 4px 15px rgba(59, 130, 246, 0.4)",
          opacity: bookingState === "processing" ? 0.7 : 1,
          marginBottom: "16px",
        }}
      >
        {bookingState === "processing" ? "⏳ Processing with AI..." : "✓ Book with AI"}
      </button>

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
                        background: "rgba(59, 130, 246, 0.2)",
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
