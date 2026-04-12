import { useEffect, useState } from "react";
import { API } from "../../utils/api";

const AlumniProfile = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [profile, setProfile] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/api/alumni/profile/${user.user_id}`)
      .then(res => res.json())
      .then(data => setProfile(data || {}))
      .catch(err => console.error(err));
  }, [user.user_id]);

  const updateProfile = async () => {
    const res = await fetch(`${API}/api/alumni/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, alumni_id: user.user_id }),
    });

    const data = await res.json();
    setMsg(data.message);
  };

  return (
    <div className="page card">
      <h2>Alumni Profile</h2>

      <label>Name</label>
      <input value={profile.name ?? ""} disabled />

      <label>Email</label>
      <input value={profile.email ?? ""} disabled />

      <label>Domain</label>
      <input value={profile.domain ?? ""} />



      <label>Company</label>
      <input value={profile.company ?? ""} />

      <label>Expertise</label>
      <input value={profile.expertise ?? ""} />

      <label>LinkedIn</label>
      <input
        value={profile.linkedin_url ?? ""}
        onChange={e =>
          setProfile({ ...profile, linkedin_url: e.target.value })
        }
      />

      <label>Coding Profile</label>
      <input
        value={profile.coding_url ?? ""}
        onChange={e =>
          setProfile({ ...profile, coding_url: e.target.value })
        }
      />

      <label>Resume URL</label>
      <input
        value={profile.resume_url ?? ""}
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

export default AlumniProfile;
