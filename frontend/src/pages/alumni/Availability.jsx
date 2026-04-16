import { useEffect, useState } from "react";
import { API } from "../../utils/api";

import { useAuth } from "../../hooks/useAuth";

const Availability = () => {
  const user = useAuth();
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSlots = () => {
    fetch(`${API}/api/alumni/availability/${user.user_id}`)
      .then(res => res.json())
      .then(setSlots);
  };

  useEffect(loadSlots, [user.user_id]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const addAvailability = async () => {
    setError("");
    setSuccess("");

    if (!form.date || !form.start_time || !form.end_time) {
      setError("Please fill in all fields");
      return;
    }

    if (form.start_time >= form.end_time) {
      setError("End time must be after start time");
      return;
    }

    try {
      const res = await fetch(`${API}/api/alumni/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumni_id: user.user_id, ...form }),
      });

      if (!res.ok) throw new Error("Failed to add slot");

      setSuccess("✅ Slot added successfully!");
      setForm({ date: "", start_time: "", end_time: "" });
      setTimeout(() => {
        loadSlots();
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError("Failed to add slot. Please try again.");
    }
  };

  return (
    <div className="page">
      <h2 style={{ marginBottom: 28 }}>📅 My Availability</h2>

      {/* Add New Slot */}
      <div className="card" style={{
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))",
        border: "1px solid rgba(139, 92, 246, 0.2)",
        marginBottom: 28,
      }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>➕ Add New Time Slot</h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, opacity: 0.8 }}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, opacity: 0.8 }}>Start Time</label>
            <input
              type="time"
              value={form.start_time}
              onChange={e => setForm({ ...form, start_time: e.target.value })}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, opacity: 0.8 }}>End Time</label>
            <input
              type="time"
              value={form.end_time}
              onChange={e => setForm({ ...form, end_time: e.target.value })}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 12,
            fontSize: 12,
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#86efac",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 12,
            fontSize: 12,
          }}>
            {success}
          </div>
        )}

        <button
          className="secondary"
          onClick={addAvailability}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          📌 Add Slot
        </button>
      </div>

      {/* Available Slots */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ opacity: 0.6, fontSize: 12 }}>
          {slots.length} slot{slots.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {slots.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🕐</p>
          <p style={{ opacity: 0.6, fontSize: 14 }}>No slots added yet. Create your first availability slot above!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {slots.map(slot => (
            <div
              key={slot.availability_id}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 20,
                padding: "20px 24px",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08))",
                border: "1px solid rgba(16, 185, 129, 0.15)",
                borderLeft: "4px solid #10b981",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>📆</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#86efac" }}>
                      {formatDate(slot.date)}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                      ⏰ {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 11,
                fontWeight: 600,
                color: "#86efac",
              }}>
                ✓ Available
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Availability;
