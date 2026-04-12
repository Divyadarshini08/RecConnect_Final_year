import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * GET student profile
 */
router.get("/profile/:id", async (req, res) => {
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
});

/**
 * UPDATE student profile
 */
router.post("/profile", async (req, res) => {
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
});

/**
 * STUDENT DASHBOARD
 */
router.get("/dashboard/:studentId", async (req, res) => {
  const studentId = req.params.studentId;

  const [[student]] = await db.query(
    "SELECT skills, interests FROM student_profile WHERE student_id=?",
    [studentId]
  );

  if (!student) {
    return res.json({ alumni: 0, sessions: 0 });
  }

  const [[alumniCount]] = await db.query(
    `
    SELECT COUNT(DISTINCT u.user_id) AS count
    FROM users u
    JOIN alumni_profile ap ON ap.alumni_id = u.user_id
    JOIN availability av ON av.alumni_id = u.user_id
    WHERE u.role='alumni'
      AND av.is_booked=0
      AND (ap.domain LIKE ? OR ap.expertise LIKE ?)
    `,
    [`%${student.interests}%`, `%${student.skills}%`]
  );

  const [[sessionsCount]] = await db.query(
    "SELECT COUNT(*) AS count FROM bookings WHERE student_id=?",
    [studentId]
  );

  res.json({
    alumni: alumniCount.count,
    sessions: sessionsCount.count,
  });
});

/**
 * AVAILABLE ALUMNI (MATCHED)
 */
router.get("/available-alumni/:studentId", async (req, res) => {
  const studentId = req.params.studentId;

  const [[student]] = await db.query(
    "SELECT skills, interests FROM student_profile WHERE student_id=?",
    [studentId]
  );

  if (!student) return res.json([]);

  const [rows] = await db.query(
    `
    SELECT DISTINCT
      u.user_id AS alumni_id,
      u.name,
      ap.domain,
      ap.company
    FROM users u
    JOIN alumni_profile ap ON ap.alumni_id = u.user_id
    JOIN availability av ON av.alumni_id = u.user_id
    WHERE u.role='alumni'
      AND av.is_booked=0
      AND (ap.domain LIKE ? OR ap.expertise LIKE ?)
    `,
    [`%${student.interests}%`, `%${student.skills}%`]
  );

  res.json(rows);
});

/**
 * ALUMNI SLOTS (student view)
 */
router.get("/alumni-slots/:alumniId", async (req, res) => {
  const [rows] = await db.query(
    `
    SELECT availability_id, date, start_time, end_time
    FROM availability
    WHERE alumni_id=? AND is_booked=0
    `,
    [req.params.alumniId]
  );

  res.json(rows);
});

/**
 * STUDENT SESSIONS
 */
router.get("/sessions/:studentId", async (req, res) => {
  const [rows] = await db.query(
    `
    SELECT b.booking_id, b.status,
           u.name AS alumni_name,
           av.date, av.start_time, av.end_time
    FROM bookings b
    JOIN users u ON u.user_id = b.alumni_id
    JOIN availability av ON av.availability_id = b.availability_id
    WHERE b.student_id = ?
    ORDER BY av.date
    `,
    [req.params.studentId]
  );

  res.json(rows);
});

/**
 * STUDENT UPCOMING SESSIONS
 */
router.get("/upcoming/:studentId", async (req, res) => {
  const [rows] = await db.query(
    `
    SELECT b.booking_id,
           b.date, b.start_time, b.end_time,
           b.meet_link,
           u.name AS alumni_name,
           ap.company
    FROM bookings b
    JOIN users u ON u.user_id = b.alumni_id
    LEFT JOIN alumni_profile ap ON ap.alumni_id = b.alumni_id
    WHERE b.student_id = ?
      AND b.status = 'approved'
    ORDER BY b.date
    `,
    [req.params.studentId]
  );

  res.json(rows);
});


export default router;
