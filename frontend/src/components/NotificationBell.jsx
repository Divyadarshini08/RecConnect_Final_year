import { useState, useEffect, useRef } from "react";
import { API } from "../utils/api";

const NotificationBell = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unread = Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0;

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/api/agent/notifications/${user.user_id}`);
      const data = await res.json();
      setNotifications(data);
    } catch {}
  };

  const markRead = async (id) => {
    await fetch(`${API}/api/agent/notifications/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: id }),
    }).catch(() => {});
    setNotifications(prev =>
      prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
    );
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: 10,
          width: 38,
          height: 38,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontSize: 16,
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: "absolute",
            top: -4,
            right: -4,
            background: "#ef4444",
            color: "#fff",
            borderRadius: "50%",
            width: 18,
            height: 18,
            fontSize: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
          }}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: 44,
          width: 320,
          background: "rgba(15,32,39,0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          zIndex: 1000,
          overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            Notifications
            {unread > 0 && (
              <span style={{
                background: "rgba(102,126,234,0.2)",
                color: "#93c5fd",
                borderRadius: 20,
                padding: "2px 10px",
                fontSize: 11,
              }}>{unread} new</span>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", opacity: 0.5, fontSize: 13 }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.notification_id}
                  onClick={() => markRead(n.notification_id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer",
                    background: n.is_read ? "transparent" : "rgba(102,126,234,0.08)",
                    transition: "background 0.2s",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  {!n.is_read && (
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "#667eea", flexShrink: 0, marginTop: 5,
                    }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, opacity: 0.9, margin: 0, lineHeight: 1.5 }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: 11, opacity: 0.4, margin: "4px 0 0" }}>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
