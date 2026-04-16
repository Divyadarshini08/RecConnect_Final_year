import { useEffect, useState } from "react";
import { API } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";

const MySessions = () => {
  const user = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/student/sessions/${user.user_id}`)
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user.user_id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBD";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "TBD";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)", text: "#a7f3d0" };
      case "pending":
        return { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)", text: "#93c5fd" };
      case "rejected":
        return { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)", text: "#fca5a5" };
      case "completed":
        return { bg: "rgba(107, 114, 128, 0.15)", border: "rgba(107, 114, 128, 0.3)", text: "#d1d5db" };
      default:
        return { bg: "rgba(0, 0, 0, 0.2)", border: "rgba(255, 255, 255, 0.1)", text: "#e5e7eb" };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return "✅";
      case "pending":
        return "⏳";
      case "rejected":
        return "❌";
      case "completed":
        return "🎉";
      default:
        return "📌";
    }
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
          background: "rgba(59, 130, 246, 0.15)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "20px",
          padding: "6px 16px",
          fontSize: "12px",
          color: "#93c5fd",
          marginBottom: "12px",
          fontWeight: "600",
        }}>
          📋 Session History
        </div>
        <h2 style={{ marginBottom: "8px" }}>My Sessions</h2>
        <p style={{ opacity: 0.6, fontSize: "15px" }}>
          {sessions.length === 0
            ? "No sessions yet. Start booking with alumni!"
            : `You have ${sessions.length} session${sessions.length !== 1 ? "s" : ""}`}
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
          <p style={{ fontSize: "18px", opacity: 0.5, marginBottom: "12px" }}>📭 No sessions yet</p>
          <p style={{ fontSize: "14px", opacity: 0.4 }}>
            Book with alumni to start your mentorship journey!
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "20px",
        }}>
          {sessions.map((s) => {
            const statusColor = getStatusColor(s.status);
            return (
              <div
                key={s.booking_id}
                className="card"
                style={{
                  background: `linear-gradient(135deg, ${statusColor.bg}, rgba(0, 0, 0, 0.05))`,
                  border: `1px solid ${statusColor.border}`,
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
                    {s.alumni_name || "Alumni"}
                  </h3>
                  {s.company && (
                    <p style={{ fontSize: "13px", opacity: 0.6, margin: "4px 0 0 0" }}>
                      {s.company}
                    </p>
                  )}
                </div>

                {/* Date & Time */}
                {s.date && (
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
                      <div style={{ fontSize: "14px", fontWeight: "600", color: statusColor.text }}>
                        {formatDate(s.date)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "12px", opacity: 0.5, marginBottom: "2px" }}>🕐 Time</div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: statusColor.text }}>
                        {s.start_time && s.end_time ? `${formatTime(s.start_time)} – ${formatTime(s.end_time)}` : "TBD"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Google Meet Link */}
                {s.meet_link && s.status === "approved" ? (
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
                ) : null}

                {/* Status Badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  background: statusColor.bg,
                  border: `1px solid ${statusColor.border}`,
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: statusColor.text,
                }}>
                  <span>{getStatusIcon(s.status)}</span>
                  <span>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySessions;
