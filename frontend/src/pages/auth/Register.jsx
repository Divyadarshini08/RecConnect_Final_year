import { useState } from "react";
import { API } from "../../utils/api";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    skills: "",
    interests: "",
    domain: "",
    company: "",
    expertise: "",
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role,
      skills: form.skills,
      interests: form.interests,
      domain: form.domain,
      company: form.company,
      expertise: form.expertise,
    };

    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Registration failed");
      return;
    }

    alert("Registration successful");
    navigate("/login");
  };

  return (
    <div className="page card auth-card">
      <h2>Create Account</h2>

      <label>Role</label>
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="student">Student</option>
        <option value="alumni">Alumni</option>
      </select>

      <label>Name</label>
      <input name="name" onChange={handleChange} required />

      <label>Email</label>
      <input name="email" type="email" onChange={handleChange} required />

      <label>Password</label>
      <input
        name="password"
        type="password"
        onChange={handleChange}
        required
      />

      <label>Confirm Password</label>
      <input
        name="confirmPassword"
        type="password"
        onChange={handleChange}
        required
      />

      {role === "student" && (
        <>
          <label>Skills</label>
          <input name="skills" onChange={handleChange} required />

          <label>Key Interests</label>
          <input name="interests" onChange={handleChange} required />
        </>
      )}

      {role === "alumni" && (
        <>
          <label>Domain of Work</label>
          <input name="domain" onChange={handleChange} required />

          <label>Company</label>
          <input name="company" onChange={handleChange} required />

          <label>Expertise</label>
          <input name="expertise" onChange={handleChange} required />
        </>
      )}

      {error && <p className="error">{error}</p>}

      <button className="primary" onClick={handleRegister}>
        Register
      </button>
    </div>
  );
};

export default Register;
