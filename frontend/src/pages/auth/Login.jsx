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
    
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      console.log("Logging in with email:", email);
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Login response status:", res.status);
      const data = await res.json();
      console.log("Login response:", data);

      if (!res.ok) {
        return setError(data.message || "Login failed");
      }

      if (data.user_id) {
        // Save user data WITH token
        localStorage.setItem("user", JSON.stringify({
          user_id: data.user_id,
          name: data.name,
          email: data.email,
          role: data.role,
          token: data.token  // JWT token for future requests
        }));
        navigate(
          data.role === "student"
            ? "/student/dashboard"
            : "/alumni/dashboard"
        );
      } else {
        setError("Login response missing user data");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to server. Make sure backend is running on port 5000.");
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
