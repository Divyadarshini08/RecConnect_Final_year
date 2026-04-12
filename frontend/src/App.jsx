import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

// Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import FindAlumni from "./pages/student/FindAlumni";
import MySessions from "./pages/student/MySessions";
import StudentProfile from "./pages/student/StudentProfile";
import AlumniSlots from "./pages/student/AlumniSlots";
import StudentUpcomingSessions from "./pages/student/StudentUpcomingSessions";

// 🤖 Agentic AI pages
import AIChat from "./pages/student/AIChat";
import SmartMatch from "./pages/student/SmartMatch";
import AgentBooking from "./pages/student/AgentBooking";

// Alumni pages
import AlumniDashboard from "./pages/alumni/AlumniDashboard";
import Availability from "./pages/alumni/Availability";
import Requests from "./pages/alumni/Requests";
import AlumniProfile from "./pages/alumni/AlumniProfile";
import UpcomingSessions from "./pages/alumni/UpcomingSessions";

function App() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <>
      {user && <Navbar />}

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student – standard */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/find-alumni" element={<FindAlumni />} />
        <Route path="/student/my-sessions" element={<MySessions />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/alumni/:alumniId" element={<AlumniSlots />} />
        <Route path="/student/upcoming-sessions" element={<StudentUpcomingSessions />} />

        {/* Student – Agentic AI */}
        <Route path="/student/ai-chat" element={<AIChat />} />
        <Route path="/student/smart-match" element={<SmartMatch />} />
        <Route path="/student/agent-book/:alumniId" element={<AgentBooking />} />

        {/* Alumni */}
        <Route path="/alumni/dashboard" element={<AlumniDashboard />} />
        <Route path="/alumni/availability" element={<Availability />} />
        <Route path="/alumni/requests" element={<Requests />} />
        <Route path="/alumni/upcoming-sessions" element={<UpcomingSessions />} />
        <Route path="/alumni/profile" element={<AlumniProfile />} />
      </Routes>
    </>
  );
}

export default App;
