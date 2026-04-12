import { useEffect, useState } from "react";
import { API } from "../../utils/api";

const Availability = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
  });

  const loadSlots = () => {
    fetch(`${API}/api/alumni/availability/${user.user_id}`)
      .then(res => res.json())
      .then(setSlots);
  };

  useEffect(loadSlots, [user.user_id]);

  const addAvailability = async () => {
    await fetch(`${API}/api/alumni/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alumni_id: user.user_id, ...form }),
    });
    setForm({ date: "", start_time: "", end_time: "" });
    loadSlots();
  };

  return (
    <div className="page">
      <h2>My Availability</h2>

      <div className="card">
        <input type="date" value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })} />
        <input type="time" value={form.start_time}
          onChange={e => setForm({ ...form, start_time: e.target.value })} />
        <input type="time" value={form.end_time}
          onChange={e => setForm({ ...form, end_time: e.target.value })} />

        <button className="secondary" onClick={addAvailability}>
          Add Slot
        </button>
      </div>

      {slots.map(slot => (
        <div key={slot.availability_id} className="card">
          <p>{slot.date} · {slot.start_time} – {slot.end_time}</p>
        </div>
      ))}
    </div>
  );
};

export default Availability;
