import { useEffect, useState } from "react";
import { API } from "../../utils/api";

const FindAlumni = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/student/available-alumni/${user.user_id}`)
      .then(res => res.json())
      .then(data => {
        setAlumni(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading alumni:", err);
        setLoading(false);
      });
  }, [user.user_id]);

  if (loading) return <p>Loading alumni...</p>;

  return (
    <div className="page">
      <h2>Available Alumni</h2>

      {alumni.length === 0 ? (
        <p style={{ opacity: 0.6 }}>
          No matching alumni available right now.
        </p>
      ) : (
        <div className="grid">
          {alumni.map(a => (
            <div key={a.alumni_id} className="card">
              <h3>{a.name}</h3>
              <p><b>Domain:</b> {a.domain}</p>
              <p><b>Company:</b> {a.company}</p>

              <button
                className="primary"
                onClick={() =>
                  window.location.href = `/student/alumni/${a.alumni_id}`
                }
              >
                View Slots
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindAlumni;
