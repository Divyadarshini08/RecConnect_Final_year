import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";

const AlumniSlots = () => {
  const { alumniId } = useParams();
  const navigate = useNavigate();
  const user = useAuth();

  const [slots, setSlots] = useState([]);
  const [alumniName, setAlumniName] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingState, setBookingState] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [query, setQuery] = useState("I'd like to book a mentorship session");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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

  const bookSlot = async () => {
    if (!selectedSlot) {
      setError("Please select a time slot");
      return;
    }
    
    setBookingState("processing");
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        student_id: user.user_id,
        alumni_id: parseInt(alumniId),
        availability_id: selectedSlot.availability_id,
        query: query || "I'd like to book a mentorship session",
      };

      console.log("📤 Sending booking payload:", payload);

      // Use simple booking endpoint instead of agent pipeline
      const res = await fetch(`${API}/api/booking/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response status:", res.status, res.statusText);
      
      const data = await res.json();
      console.log("📥 Response data:", data);
      
      if (!res.ok) {
        setError(`Booking failed: ${data.error || "Unknown error"}`);
        setBookingState(null);
        return;
      }
      
      // Check if booking was successful
      if (data.success || data.message) {
        setSuccess(true);
        setBookingState("success");
        console.log("✅ Booking successful!");
        setTimeout(() => {
          navigate("/student/dashboard");
        }, 2000);
      } else {
        setError("Booking request sent, awaiting approval");
        setBookingState(null);
      }
    } catch (err) {
      console.error("❌ Booking failed:", err);
      setError(`Failed to send booking request: ${err.message}`);
      setBookingState(null);
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

  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "60px" }}>
        <p style={{ opacity: 0.6, fontSize: "16px" }}>Loading available slots...</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "20px",
          padding: "6px 16px",
          fontSize: "12px",
          color: "#a7f3d0",
          marginBottom: "12px",
          fontWeight: "600",
        }}>
          📅 Book a Session
        </div>
        <h2 style={{ marginBottom: "8px" }}>Schedule with {alumniName}</h2>
        <p style={{ opacity: 0.6, fontSize: "15px" }}>
          Select an available time slot and describe what you'd like to discuss.
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

      {success && (
        <div style={{
          padding: "12px 16px",
          background: "rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "8px",
          color: "#a7f3d0",
          marginBottom: "20px",
          fontSize: "14px",
        }}>
          ✅ Booking request sent! Redirecting...
        </div>
      )}

      {/* Session Topic */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <label style={{ fontWeight: "600", fontSize: "14px", marginBottom: "8px", display: "block", color: "#e5e7eb" }}>
          💬 What would you like to discuss?
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          placeholder="e.g., I need help with my resume for software engineering roles..."
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

      {/* Time Slot Selection */}
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
            <p style={{ opacity: 0.5, fontSize: "14px" }}>😔 No available slots right now</p>
            <p style={{ opacity: 0.4, fontSize: "12px", marginTop: "4px" }}>
              Check back later or contact the alumni directly.
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
                onHover={(e) => {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#93c5fd", marginBottom: "4px" }}>
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
        onClick={bookSlot}
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
        }}
      >
        {bookingState === "processing" ? "⏳ Sending request..." : "✓ Book Session"}
      </button>

      <p style={{
        textAlign: "center",
        opacity: 0.5,
        fontSize: "12px",
        marginTop: "16px",
      }}>
        {selectedSlot
          ? `Selected: ${formatDate(selectedSlot.date)} at ${formatTime(selectedSlot.start_time)}`
          : "Select a time slot to continue"}
      </p>
    </div>
  );
};

export default AlumniSlots;
