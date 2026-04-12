import { useEffect, useState } from "react";
import { API } from "../../utils/api";

const MySessions = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/student/sessions/${user.user_id}`)
      .then(res => res.json())
      .then(setSessions);
  }, [user.user_id]);

  return (
    <div className="page">
      <h2>My Sessions</h2>

      {sessions.map(s => (
        <div className="card" key={s.booking_id}>
          <p>Session with Alumni #{s.alumni_id}</p>
          <span className={`status ${s.status}`}>
            {s.status.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MySessions;
