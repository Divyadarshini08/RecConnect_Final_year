import { useEffect, useState } from "react";
import { API } from "../../utils/api";

const UpcomingSessions = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/alumni/upcoming/${user.user_id}`)
      .then(res => res.json())
      .then(setSessions);
  }, [user.user_id]);

  const completeSession = async (booking_id) => {
    await fetch(`${API}/api/alumni/sessions/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id }),
    });

    setSessions(s => s.filter(x => x.booking_id !== booking_id));
  };

  return (
    <div className="page">
      <h2>Upcoming Sessions</h2>

      {sessions.map(s => (
        <div key={s.booking_id} className="card">
          <p><b>Student:</b> {s.student_name}</p>
          <p>{s.date} · {s.start_time} – {s.end_time}</p>

          <button
            className="primary"
            onClick={() => completeSession(s.booking_id)}
          >
            Mark as Completed
          </button>
        </div>
      ))}
    </div>
  );
};

export default UpcomingSessions;
