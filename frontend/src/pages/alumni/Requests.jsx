import { useEffect, useState } from "react";
import { API } from "../../utils/api";

const Requests = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/alumni/requests/${user.user_id}`)
      .then(res => res.json())
      .then(setRequests);
  }, [user.user_id]);

  const updateStatus = async (booking_id, status, availability_id) => {
    await fetch(`${API}/api/alumni/requests/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id, status, availability_id }),
    });

    setRequests(req =>
      req.filter(r => r.booking_id !== booking_id)
    );
  };

  return (
    <div className="page">
      <h2>Session Requests</h2>

      {requests.map(req => (
        <div key={req.booking_id} className="card">
          <p>Request from {req.student_name}</p>
          <p>{req.date} · {req.start_time} – {req.end_time}</p>

          <button
            className="primary"
            onClick={() =>
              updateStatus(req.booking_id, "approved", req.availability_id)
            }
          >
            Approve
          </button>

          <button
            className="danger"
            onClick={() =>
              updateStatus(req.booking_id, "rejected", req.availability_id)
            }
          >
            Reject
          </button>
        </div>
      ))}
    </div>
  );
};

export default Requests;
