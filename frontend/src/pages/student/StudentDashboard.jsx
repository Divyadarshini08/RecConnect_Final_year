import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../utils/api";

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [stats, setStats] = useState({ alumni: 0, sessions: 0 });

  useEffect(() => {
    fetch(`${API}/api/student/dashboard/${user.user_id}`)
      .then(res => res.json())
      .then(data => setStats({ alumni: data.alumni || 0, sessions: data.sessions || 0 }))
      .catch(err => console.error("Dashboard error:", err));
  }, [user.user_id]);

  const aiFeatures = [
    {
      icon: "🤖",
      title: "Smart Match",
      desc: "Claude ranks alumni by how well they match your goals",
      path: "/student/smart-match",
      gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    },
    {
      icon: "💬",
      title: "AI Career Advisor",
      desc: "Chat with Claude to plan your sessions and career path",
      path: "/student/ai-chat",
      gradient: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    },
  ];

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h2>Hello, {user.name?.split(" ")[0]} 👋</h2>
        <p style={{ opacity: 0.6 }}>Here's your mentorship overview</p>
      </div>

      {/* Stats */}
      <div className="grid" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <h1>{stats.alumni}</h1>
          <p>Available Alumni</p>
        </div>
        <div className="stat-card">
          <h1>{stats.sessions}</h1>
          <p>My Sessions</p>
        </div>
      </div>

      {/* AI Features section */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}>
          <h3 style={{ margin: 0 }}>AI-Powered Features</h3>
          <span style={{
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            color: "#fff",
            borderRadius: 20,
            padding: "2px 10px",
            fontSize: 11,
            fontWeight: 700,
          }}>NEW</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {aiFeatures.map(f => (
            <div
              key={f.path}
              className="card"
              onClick={() => navigate(f.path)}
              style={{
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.08)",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div style={{
                position: "absolute",
                top: 0, right: 0,
                width: 80, height: 80,
                background: f.gradient,
                opacity: 0.15,
                borderRadius: "0 0 0 80px",
              }} />
              <div style={{ fontSize: 32, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>{f.title}</h3>
              <p style={{ opacity: 0.6, fontSize: 13, margin: 0 }}>{f.desc}</p>
              <div style={{
                marginTop: 14,
                fontSize: 12,
                color: "#93c5fd",
                fontWeight: 600,
              }}>Try it →</div>
            </div>
          ))}
        </div>
      </div>

      {stats.sessions === 0 && (
        <p style={{ opacity: 0.5, fontSize: 14 }}>
          You don't have any sessions yet. Use <strong>Smart Match</strong> to find the perfect mentor 🚀
        </p>
      )}
    </div>
  );
};

export default StudentDashboard;
