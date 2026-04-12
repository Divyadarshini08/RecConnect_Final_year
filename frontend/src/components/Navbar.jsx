import { Link, useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return null;

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    color: isActive(path) ? "#fff" : "rgba(255,255,255,0.6)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: isActive(path) ? 600 : 400,
    padding: "6px 0",
    borderBottom: isActive(path) ? "2px solid #667eea" : "2px solid transparent",
    transition: "all 0.2s",
  });

  return (
    <nav className="navbar">
      <h3 className="logo">RE<span style={{ color: "#667eea" }}>Connect</span></h3>

      <div className="nav-links">
        {user.role === "student" && (
          <>
            <Link to="/student/dashboard" style={linkStyle("/student/dashboard")}>Dashboard</Link>
            <Link to="/student/smart-match" style={linkStyle("/student/smart-match")}>
              🤖 Smart Match
            </Link>
            <Link to="/student/ai-chat" style={linkStyle("/student/ai-chat")}>
              💬 AI Advisor
            </Link>
            <Link to="/student/find-alumni" style={linkStyle("/student/find-alumni")}>Find Alumni</Link>
            <Link to="/student/my-sessions" style={linkStyle("/student/my-sessions")}>My Sessions</Link>
            <Link to="/student/upcoming-sessions" style={linkStyle("/student/upcoming-sessions")}>Upcoming</Link>
            <Link to="/student/profile" style={linkStyle("/student/profile")}>Profile</Link>
          </>
        )}

        {user.role === "alumni" && (
          <>
            <Link to="/alumni/dashboard" style={linkStyle("/alumni/dashboard")}>Dashboard</Link>
            <Link to="/alumni/availability" style={linkStyle("/alumni/availability")}>Availability</Link>
            <Link to="/alumni/requests" style={linkStyle("/alumni/requests")}>Requests</Link>
            <Link to="/alumni/upcoming-sessions" style={linkStyle("/alumni/upcoming-sessions")}>Upcoming</Link>
            <Link to="/alumni/profile" style={linkStyle("/alumni/profile")}>Profile</Link>
          </>
        )}

        <NotificationBell />
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
