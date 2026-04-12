import { useEffect, useState } from "react";
import { API } from "../../utils/api";

const StudentProfile = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [profile, setProfile] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/api/student/profile/${user.user_id}`)
      .then(res => res.json())
      .then(setProfile);
  }, []);

  const updateProfile = async () => {
    const res = await fetch(`${API}/api/student/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, student_id: user.user_id }),
    });

    const data = await res.json();
    setMsg(data.message);
  };

  return (
    <div className="page card">
      <h2>Student Profile</h2>

      <label>Name</label>
      <input value={profile.name || ""} disabled />

      <label>Email</label>
      <input value={profile.email || ""} disabled />

      <label>Skills</label>
      <input
        value={profile.skills || ""}
        onChange={e => setProfile({ ...profile, skills: e.target.value })}
      />

      <label>Interests</label>
      <input
        value={profile.interests || ""}
        onChange={e => setProfile({ ...profile, interests: e.target.value })}
      />

      <label>LinkedIn</label>
      <input
        value={profile.linkedin_url || ""}
        onChange={e =>
          setProfile({ ...profile, linkedin_url: e.target.value })
        }
      />

      <label>Coding Profile</label>
      <input
        value={profile.coding_url || ""}
        onChange={e =>
          setProfile({ ...profile, coding_url: e.target.value })
        }
      />

      <label>Resume URL</label>
      <input
        value={profile.resume_url || ""}
        onChange={e =>
          setProfile({ ...profile, resume_url: e.target.value })
        }
      />

      <button className="primary" onClick={updateProfile}>
        Save Changes
      </button>

      {msg && <p>{msg}</p>}
    </div>
  );
};

export default StudentProfile;
