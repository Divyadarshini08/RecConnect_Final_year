import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API } from "../../utils/api";
import { getBookingEndpoint } from "../../services/api";

const AlumniSlots = () => {
  const { alumniId } = useParams(); // 🔑 THIS WAS MISSING / WRONG
  const user = JSON.parse(localStorage.getItem("user"));

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/student/alumni-slots/${alumniId}`)
      .then(res => res.json())
      .then(data => {
        setSlots(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Slot fetch error:", err);
        setLoading(false);
      });
  }, [alumniId]);

  const bookSlot = async (availability_id) => {
  try {
    const payload = {
      student_id: user.user_id,
      availability_id,
      // optional context for agents
      query: "Need resume review"
    };

    const res = await fetch(getBookingEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Booking result:", data);

    alert("Booking request sent successfully!");
  } catch (err) {
    console.error("Booking failed:", err);
    alert("Booking failed");
  }
};


  if (loading) return <p>Loading slots...</p>;

  return (
    <div className="page">
      <h2>Available Slots</h2>

      {slots.length === 0 ? (
        <p style={{ opacity: 0.6 }}>
          No slots available for this alumni right now.
        </p>
      ) : (
        <div className="grid">
          {slots.map(slot => (
            <div key={slot.availability_id} className="card">
              <p>
                <b>Date:</b> {slot.date}
              </p>
              <p>
                <b>Time:</b> {slot.start_time} – {slot.end_time}
              </p>

              <button
                className="primary"
                onClick={() => bookSlot(slot.availability_id)}
              >
                Request Session
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlumniSlots;
