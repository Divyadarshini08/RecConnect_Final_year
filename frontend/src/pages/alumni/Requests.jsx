import { useEffect, useState } from "react";
import { API } from "../../utils/api";

import { useAuth } from "../../hooks/useAuth";

const Requests = () => {
  const user = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API}/api/alumni/requests/${user.user_id}`);
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [user.user_id]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const updateStatus = async (booking_id, status, availability_id) => {
    setLoading(true);
    try {
      await fetch(`${API}/api/alumni/requests/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id, status, availability_id }),
      });

      setRequests(req =>
        req.filter(r => r.booking_id !== booking_id)
      );
      // Refresh after update
      setTimeout(fetchRequests, 500);
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>📬 Session Requests</h2>
        <button
          className="secondary"
          onClick={fetchRequests}
          disabled={loading}
          style={{ padding: "8px 16px", fontSize: 12, borderRadius: 10 }}
        >
          🔄 Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📭</p>
          <p style={{ opacity: 0.6 }}>No pending requests</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {requests.map(req => (
            <div key={req.booking_id} className="card" style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
              padding: "20px 24px",
              border: "1px solid rgba(139, 92, 246, 0.2)"
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{req.student_name}</h3>
                <div style={{ display: "flex", gap: 16, fontSize: 13, opacity: 0.7 }}>
                  <span>📅 {formatDate(req.date)}</span>
                  <span>🕐 {req.start_time.substring(0, 5)} – {req.end_time.substring(0, 5)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                <button
                  className="secondary"
                  onClick={() =>
                    updateStatus(req.booking_id, "approved", req.availability_id)
                  }
                  disabled={loading}
                  style={{ padding: "8px 16px", fontSize: 12, borderRadius: 10 }}
                >
                  ✅ Approve
                </button>
                <button
                  className="danger"
                  onClick={() =>
                    updateStatus(req.booking_id, "rejected", req.availability_id)
                  }
                  disabled={loading}
                  style={{ padding: "8px 16px", fontSize: 12, borderRadius: 10 }}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requests;
