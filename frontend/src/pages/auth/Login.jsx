import { useState } from "react";
import { API } from "../../utils/api";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) return setError(data.message);

      localStorage.setItem("user", JSON.stringify(data));

      navigate(
        data.role === "student"
          ? "/student/dashboard"
          : "/alumni/dashboard"
      );
    } catch {
      setError("Server not reachable");
    }
  };

  return (
    <div className="page">
      <div className="card auth-card">
        <h2>Welcome Back 👋</h2>
        <p style={{ opacity: 0.6 }}>Login to continue</p>

        <label>Email</label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="example@mail.com"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {error && <p className="error">{error}</p>}

        <button className="primary" onClick={handleLogin}>
          Login
        </button>

        {/* Register link */}
        <p style={{ marginTop: "16px", textAlign: "center", opacity: 0.8 }}>
          Don’t have an account?{" "}
          <Link to="/register" style={{ color: "#93c5fd", fontWeight: 600 }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
