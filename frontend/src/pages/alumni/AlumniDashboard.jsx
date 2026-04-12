import { useEffect, useState } from "react";
import { API } from "../../utils/api";

const AlumniDashboard = () => {
  // ✅ FIX: define user
  const user = JSON.parse(localStorage.getItem("user"));

  const [stats, setStats] = useState({
    pending: 0,
    upcoming: 0,
    completed: 0,
  });

  useEffect(() => {
    if (!user) return;

    fetch(`${API}/api/alumni/dashboard/${user.user_id}`)
      .then(res => res.json())
      .then(data => {
        setStats({
          pending: data.pending || 0,
          upcoming: data.upcoming || 0,
          completed: data.completed || 0,
        });
      })
      .catch(err => console.error("Dashboard error:", err));
  }, [user]);

  return (
    <div className="page">
      <h2>Welcome back 👋</h2>
      <p style={{ opacity: 0.7 }}>Here’s your session overview</p>

      <div className="grid">
        <div className="stat-card">
          <h1>{stats.pending}</h1>
          <p>Pending Requests</p>
        </div>

        <div className="stat-card">
          <h1>{stats.upcoming}</h1>
          <p>Upcoming Sessions</p>
        </div>

        <div className="stat-card">
          <h1>{stats.completed}</h1>
          <p>Completed Sessions</p>
        </div>
      </div>
    </div>
  );
};

export default AlumniDashboard;
