import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Default admin credentials (change these!)
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "Admin@123";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Store admin token
        const token = btoa(`${username}:${Date.now()}`);
        localStorage.setItem("admin_token", token);
        localStorage.setItem("admin_user", username);
        navigate("/admin");
      } else {
        setError("❌ Invalid credentials");
      }
    } catch (err) {
      setError("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card auth-card" style={{ maxWidth: "400px", margin: "60px auto" }}>
        <h2>🔐 Admin Login</h2>
        <p style={{ opacity: 0.6, marginBottom: "24px" }}>Enter admin credentials to continue</p>

        <form onSubmit={handleLogin}>
          <label style={{ display: "block", marginBottom: "12px" }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            disabled={loading}
            style={{ width: "100%", marginBottom: "16px" }}
          />

          <label style={{ display: "block", marginBottom: "12px" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            disabled={loading}
            style={{ width: "100%", marginBottom: "16px" }}
          />

          {error && (
            <div style={{
              padding: "12px",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#fca5a5",
              borderRadius: "4px",
              marginBottom: "16px",
              fontSize: "13px",
              border: "1px solid rgba(239, 68, 68, 0.3)"
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "🔄 Logging in..." : "Login"}
          </button>
        </form>

        <div style={{
          marginTop: "20px",
          padding: "12px",
          background: "rgba(59, 130, 246, 0.15)",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#93c5fd",
          border: "1px solid rgba(59, 130, 246, 0.3)"
        }}>
          <p><strong>Demo Credentials:</strong></p>
          <p>Username: <code style={{ fontFamily: "monospace", background: "rgba(59, 130, 246, 0.2)", padding: "2px 6px", borderRadius: "3px" }}>admin</code></p>
          <p>Password: <code style={{ fontFamily: "monospace", background: "rgba(59, 130, 246, 0.2)", padding: "2px 6px", borderRadius: "3px" }}>Admin@123</code></p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
