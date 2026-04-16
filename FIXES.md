# REConnect - Recommended Code Fixes

This document provides specific code changes to fix the critical issues identified in CODE_REVIEW.md.

---

## FIX #1: Frontend Environment Configuration

### Create file: `frontend/.env.local`

```env
VITE_API_URL=http://localhost:5000
```

---

## FIX #2: Implement JWT Authentication

### Update: `backend/routes/auth.routes.js`

```javascript
import express from "express";
import db from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * REGISTER - CREATE USER AND JWT
 */
router.post("/register", async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    skills,
    interests,
    domain,
    company,
    expertise,
  } = req.body;

  try {
    // Validate inputs
    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hash = await bcrypt.hash(password, 10);

    // 1️⃣ Insert user
    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, hash, role]
    );

    const userId = result.insertId;

    // 2️⃣ Student profile
    if (role === "student") {
      await db.query(
        `INSERT INTO student_profile (student_id, skills, interests)
         VALUES (?, ?, ?)`,
        [userId, skills || "", interests || ""]
      );
    }

    // 3️⃣ Alumni profile
    if (role === "alumni") {
      await db.query(
        `INSERT INTO alumni_profile (alumni_id, domain, company, expertise)
         VALUES (?, ?, ?, ?)`,
        [userId, domain || "", company || "", expertise || ""]
      );
    }

    // 4️⃣ Generate JWT token
    const token = jwt.sign(
      { id: userId, role, email },
      process.env.JWT_SECRET || "default-secret-change-me",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      user_id: userId,
      role,
      name,
      token, // ✅ ADD JWT TOKEN
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Registration failed" });
  }
});

/**
 * LOGIN - VERIFY AND ISSUE JWT
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [[user]] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "default-secret-change-me",
      { expiresIn: "7d" }
    );

    res.json({
      user_id: user.user_id,
      role: user.role,
      name: user.name,
      token, // ✅ RETURN JWT
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;
```

### Update: `frontend/src/pages/auth/Login.jsx`

```javascript
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

      // ✅ Store BOTH user data AND token
      localStorage.setItem("user", JSON.stringify({
        user_id: data.user_id,
        role: data.role,
        name: data.name,
      }));
      localStorage.setItem("auth_token", data.token); // ✅ SAVE JWT

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

        <p style={{ marginTop: "16px", textAlign: "center", opacity: 0.8 }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#93c5fd", fontWeight: 600 }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
```

### Create: `frontend/src/hooks/useApi.js` (Helper for authenticated requests)

```javascript
import { API } from "../utils/api";

export const useApi = () => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
    };
  };

  const apiFetch = async (endpoint, options = {}) => {
    const res = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (res.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return res;
  };

  return { apiFetch, getAuthHeaders };
};
```

### Update: `frontend/src/pages/student/StudentProfile.jsx`

```javascript
import { useEffect, useState } from "react";
import { API } from "../../utils/api";
import { useApi } from "../../hooks/useApi"; // ✅ USE HELPER

const StudentProfile = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const { apiFetch } = useApi(); // ✅ USE AUTHENTICATED FETCH
  const [profile, setProfile] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiFetch(`/api/student/profile/${user.user_id}`)
      .then(res => res.json())
      .then(setProfile);
  }, []);

  const updateProfile = async () => {
    const res = await apiFetch(`/api/student/profile`, {
      method: "POST",
      body: JSON.stringify({ ...profile, student_id: user.user_id }),
    });

    const data = await res.json();
    setMsg(data.message);
  };

  return (
    <div className="page card">
      <h2>Student Profile</h2>
      {/* ... rest of form ... */}
    </div>
  );
};

export default StudentProfile;
```

---

## FIX #3: Update Claude Model Names

### Update all occurrences of model:

**Files to change:**
- `backend/agents/orchestrator.agent.js`
- `backend/agents/chat.agent.js`
- `backend/utils/nlp.utils.js`

**Change from:**
```javascript
model: "claude-sonnet-4-20250514",
```

**Change to:**
```javascript
model: "claude-3-5-sonnet-20241022",  // Latest and recommended
```

**Example fix in orchestrator.agent.js:**

```javascript
async function callClaude(systemPrompt, userPrompt, maxTokens = 800) {
  try {
    const start = Date.now();
    
    const truncatedUserPrompt = userPrompt.substring(0, 3000);
    
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022", // ✅ FIXED
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: truncatedUserPrompt }],
    });
    
    // ... rest of code ...
  }
}
```

---

## FIX #4: Add Auth Middleware to All Routes

### Update: `backend/routes/student.routes.js`

```javascript
import express from "express";
import db from "../db.js";
import { verifyAuth, authorizeStudent } from "../middleware/auth.middleware.js"; // ✅ ADD

const router = express.Router();

// ✅ APPLY AUTH TO ALL STUDENT ROUTES
router.use(verifyAuth);

/**
 * GET student profile
 */
router.get("/profile/:id", authorizeStudent, async (req, res) => {
  try {
    const studentId = req.params.id;

    const [[user]] = await db.query(
      "SELECT name, email FROM users WHERE user_id = ?",
      [studentId]
    );

    const [[profile]] = await db.query(
      "SELECT skills, interests, linkedin_url, coding_url, resume_url FROM student_profile WHERE student_id = ?",
      [studentId]
    );

    res.json({
      name: user?.name || "",
      email: user?.email || "",
      skills: profile?.skills || "",
      interests: profile?.interests || "",
      linkedin_url: profile?.linkedin_url || "",
      coding_url: profile?.coding_url || "",
      resume_url: profile?.resume_url || "",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * UPDATE student profile
 */
router.post("/profile", authorizeStudent, async (req, res) => {
  try {
    const {
      student_id,
      skills,
      interests,
      linkedin_url,
      coding_url,
      resume_url,
    } = req.body;

    await db.query(
      `INSERT INTO student_profile
       (student_id, skills, interests, linkedin_url, coding_url, resume_url)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         skills=VALUES(skills),
         interests=VALUES(interests),
         linkedin_url=VALUES(linkedin_url),
         coding_url=VALUES(coding_url),
         resume_url=VALUES(resume_url)`,
      [student_id, skills, interests, linkedin_url, coding_url, resume_url]
    );

    res.json({ message: "Student profile updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ... rest of routes ...

export default router;
```

### Similar updates needed for:
- `backend/routes/alumni.routes.js`
- `backend/routes/booking.routes.js`

---

## FIX #5: Update .env with Secure JWT Secret

### Update: `.env`

```bash
# REConnect Backend Environment Variables
# ─────────────────────────────────────

# Anthropic Claude API Key (required for agentic features)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database
DB_HOST=localhost
DB_USER=reconnect_user
DB_PASSWORD=reconnect123
DB_NAME=reconnect

# Server
PORT=5000
NODE_ENV=development

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your_secure_random_secret_at_least_32_characters_long_change_this
```

### For Production:
```bash
# Generate strong secret:
# On Linux/Mac: openssl rand -base64 32
# Result example: xR8kL9mP2qW5vN7bZ3xC6dF8gH0jK1lM2nO3pQ=

JWT_SECRET=xR8kL9mP2qW5vN7bZ3xC6dF8gH0jK1lM2nO3pQ=
```

---

## FIX #6: Fix Time Conflict Detection Logic

### Update: `backend/agents/orchestrator.agent.js` (lines 250-263)

```javascript
// BEFORE (INCORRECT - both conditions identical):
const [[timeConflict]] = await db.query(
  `SELECT COUNT(*) AS c FROM bookings b
   JOIN availability av ON av.availability_id = b.availability_id
   WHERE b.student_id = ? 
   AND DATE(av.date) = DATE(?)
   AND (
     (TIME(av.start_time) < TIME(?)  AND TIME(av.end_time) > TIME(?))
     OR 
     (TIME(av.start_time) < TIME(?) AND TIME(av.end_time) > TIME(?))
   )
   AND b.status IN ('pending', 'approved')
   AND b.booking_id != ?`,
  [
    studentId,
    slot.date,
    slot.end_time,
    slot.start_time,     // SLOT START
    slot.start_time,     // SLOT START - WRONG!
    slot.end_time,       // SLOT END
    availabilityId
  ]
);

// AFTER (CORRECT):
const [[timeConflict]] = await db.query(
  `SELECT COUNT(*) AS c FROM bookings b
   JOIN availability av ON av.availability_id = b.availability_id
   WHERE b.student_id = ? 
   AND DATE(av.date) = DATE(?)
   AND (
     (TIME(av.start_time) < TIME(?)  AND TIME(av.end_time) > TIME(?))
   )
   AND b.status IN ('pending', 'approved')
   AND b.booking_id != ?`,
  [
    studentId,
    slot.date,
    slot.end_time,       // Existing event ends after new event starts?
    slot.start_time,     // Existing event starts before new event ends?
    availabilityId
  ]
);
```

---

## FIX #7: Update Middleware to Prevent Silent Failures

### Update: `backend/middleware/auth.middleware.js`

```javascript
import jwt from "jsonwebtoken";

/**
 * Auth Middleware
 * Validates JWT tokens and ensures user identity matches requested resource
 */

export const verifyAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default-secret-change-me"
    );
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Student Authorization - Ensures user can only access their own data
 */
export const authorizeStudent = (req, res, next) => {
  const requestedStudentId = parseInt(req.body.student_id || req.params.student_id);
  
  if (!req.user || req.user.id !== requestedStudentId) {
    return res.status(403).json({ 
      error: "Forbidden - you can only access your own data" 
    });
  }
  next();
};

/**
 * Alumni Authorization - Ensures alumni can only access their own bookings
 */
export const authorizeAlumni = (req, res, next) => {
  const requestedAlumniId = parseInt(req.body.alumni_id || req.params.alumni_id);
  
  if (!req.user || req.user.id !== requestedAlumniId) {
    return res.status(403).json({ 
      error: "Forbidden - you can only access your own data" 
    });
  }
  next();
};
```

---

## FIX #8: Remove Backend Dependencies from Frontend

### Update: `frontend/package.json`

**REMOVE these lines:**
```json
"bcrypt": "^6.0.0",
"cors": "^2.8.5",
"express": "^5.2.1",
"mysql2": "^3.16.0",
"node-fetch": "^3.3.2"
```

Then run:
```bash
npm install  # Reinstall with correct dependencies only
```

---

## FIX #9: Add Error Boundaries to Frontend

### Create: `frontend/src/components/ErrorBoundary.jsx`

```javascript
import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page card" style={{ textAlign: "center", color: "#ef4444" }}>
          <h2>⚠️ Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button 
            className="primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Update: `frontend/src/App.jsx`

```javascript
import { ErrorBoundary } from "./components/ErrorBoundary"; // ✅ ADD

function App() {
  // ...existing code...

  return (
    <ErrorBoundary>
      <>
        {user && <Navbar />}

        <Routes>
          {/* ...routes... */}
        </Routes>
      </>
    </ErrorBoundary>
  );
}
```

---

## Quick Start After Fixes

```bash
# 1. Update backend .env
echo 'JWT_SECRET=your_secure_secret_here' >> .env

# 2. Update Claude models
# (Edit orchestrator.agent.js, chat.agent.js, nlp.utils.js)

# 3. Create frontend .env.local
echo 'VITE_API_URL=http://localhost:5000' > frontend/.env.local

# 4. Update frontend package.json and reinstall
cd frontend
npm install
cd ..

# 5. Start backend
npm install
npm run dev &

# 6. Start frontend
cd frontend
npm run dev
```

---

## Testing the Fixes

```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "student",
    "skills": "JavaScript, React",
    "interests": "Web Development"
  }'

# Should return { token: "...", user_id: 1, ... }

# Test login with JWT
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Use the token in subsequent requests
curl -X GET http://localhost:5000/api/student/profile/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

All critical issues should be resolved with these fixes. Start with #1-#3 as they block everything else.
