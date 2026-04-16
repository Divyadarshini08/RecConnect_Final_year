import { Link, useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const navigate = useNavigate();
  const adminUser = localStorage.getItem("admin_user");

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/admin/login");
  };

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1>⚙️ Admin Panel</h1>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>

        <p style={{ opacity: 0.8, marginBottom: "32px", color: "#e5e7eb" }}>
          Logged in as: <strong>{adminUser}</strong>
        </p>
        <p style={{ opacity: 0.7, marginBottom: "32px" }}>Manage alumni and bulk operations</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Link to="/admin/import-alumni" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "24px", background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))", border: "2px solid rgba(59, 130, 246, 0.4)", cursor: "pointer", transition: "all 0.2s" }}>
              <h3 style={{ color: "#93c5fd", marginBottom: "8px" }}>📥 Import Alumni</h3>
              <p style={{ fontSize: "13px", opacity: 0.9, color: "#bfdbfe" }}>Create new alumni from CSV</p>
            </div>
          </Link>

          <Link to="/admin/update-alumni" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "24px", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))", border: "2px solid rgba(16, 185, 129, 0.4)", cursor: "pointer", transition: "all 0.2s" }}>
              <h3 style={{ color: "#86efac", marginBottom: "8px" }}>🔄 Update Alumni</h3>
              <p style={{ fontSize: "13px", opacity: 0.9, color: "#bbf7d0" }}>Update existing profiles</p>
            </div>
          </Link>
        </div>

        <div style={{ marginTop: "32px", padding: "16px", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1))", borderRadius: "8px", color: "#fbbf24", fontSize: "13px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          <p><strong>Quick Start:</strong></p>
          <p>1. Create a CSV file with alumni data</p>
          <p>2. Upload on Import or Update page</p>
          <p>3. System handles the rest!</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
