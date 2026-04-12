import { useEffect, useState } from "react";
import { API } from "../../utils/api";

const StudentUpcomingSessions = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/student/upcoming/${user.user_id}`)
      .then(res => res.json())
      .then(setSessions)
      .catch(err => console.error(err));
  }, [user.user_id]);

  return (
    <div className="page">
      <h2>Upcoming Sessions</h2>

      {sessions.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No upcoming sessions yet.</p>
      ) : (
        <div className="grid">
          {sessions.map(s => (
            <div key={s.booking_id} className="card">
              <h3>{s.alumni_name}</h3>
              <p><b>Company:</b> {s.company || "—"}</p>
              <p><b>Date:</b> {s.date}</p>
              <p><b>Time:</b> {s.start_time} – {s.end_time}</p>

              {s.meet_link && (
                <a
                  href={s.meet_link}
                  target="_blank"
                  rel="noreferrer"
                  className="primary"
                >
                  Join Google Meet
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentUpcomingSessions;
