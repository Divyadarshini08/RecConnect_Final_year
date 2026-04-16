import { useEffect, useState } from "react";
import { API } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";

const StudentUpcomingSessions = () => {
  const user = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/student/upcoming/${user.user_id}`)
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user.user_id]);

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
        <p style={{ opacity: 0.6 }}>Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(6, 182, 212, 0.15)",
          border: "1px solid rgba(6, 182, 212, 0.3)",
          borderRadius: "20px",
          padding: "6px 16px",
          fontSize: "12px",
          color: "#a5f3fc",
          marginBottom: "12px",
          fontWeight: "600",
        }}>
          📅 My Sessions
        </div>
        <h2 style={{ marginBottom: "8px" }}>Upcoming Sessions</h2>
        <p style={{ opacity: 0.6, fontSize: "15px" }}>
          {sessions.length === 0
            ? "No upcoming sessions yet. Start booking with alumni!"
            : `You have ${sessions.length} upcoming session${sessions.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {sessions.length === 0 ? (
        <div style={{
          padding: "60px 40px",
          textAlign: "center",
          background: "rgba(0, 0, 0, 0.2)",
          border: "1px dashed rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
        }}>
          <p style={{ fontSize: "18px", opacity: 0.5, marginBottom: "12px" }}>🎯 No sessions booked yet</p>
          <p style={{ fontSize: "14px", opacity: 0.4 }}>
            Find alumni, book a session, and get mentored!
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "20px",
        }}>
          {sessions.map((s) => (
            <div
              key={s.booking_id}
              className="card"
              style={{
                background: "linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.08))",
                border: "1px solid rgba(6, 182, 212, 0.2)",
                borderRadius: "12px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Alumni Info */}
              <div>
                <div style={{ fontSize: "12px", opacity: 0.5, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                  👤 Mentor
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#e5e7eb", margin: 0 }}>
                  {s.alumni_name}
                </h3>
                {s.company && (
                  <p style={{ fontSize: "13px", opacity: 0.6, margin: "4px 0 0 0" }}>
                    {s.company}
                  </p>
                )}
              </div>

              {/* Date & Time */}
              <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                borderRadius: "8px",
                padding: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.5, marginBottom: "2px" }}>📅 Date</div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#a5f3fc" }}>
                    {formatDate(s.date)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", opacity: 0.5, marginBottom: "2px" }}>🕐 Time</div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#a5f3fc" }}>
                    {formatTime(s.start_time)} – {formatTime(s.end_time)}
                  </div>
                </div>
              </div>

              {/* Google Meet Button */}
              {s.meet_link ? (
                <a
                  href={s.meet_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "12px 20px",
                    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    textAlign: "center",
                    textDecoration: "none",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
                    display: "block",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 16px rgba(6, 182, 212, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 12px rgba(6, 182, 212, 0.3)";
                  }}
                >
                  🎥 Join Google Meet
                </a>
              ) : (
                <div style={{
                  padding: "12px 20px",
                  background: "rgba(0, 0, 0, 0.2)",
                  color: "#cbd5e1",
                  border: "1px dashed rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  textAlign: "center",
                }}>
                  ⏳ Awaiting meet link
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentUpcomingSessions;
