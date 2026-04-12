import express from "express";
import db from "../db.js";

const router = express.Router();

/* =========================
   ALUMNI PROFILE
========================= */

router.get("/profile/:id", async (req, res) => {
  const alumniId = req.params.id;

  const [[user]] = await db.query(
    "SELECT name, email FROM users WHERE user_id=?",
    [alumniId]
  );

  const [[profile]] = await db.query(
    `
    SELECT domain, company, expertise,
           linkedin_url, coding_url, resume_url
    FROM alumni_profile
    WHERE alumni_id=?
    `,
    [alumniId]
  );

  // ✅ SAFE RESPONSE (handles first-time users)
  res.json({
    name: user?.name || "",
    email: user?.email || "",
    domain: profile?.domain || "",
    company: profile?.company || "",
    expertise: profile?.expertise || "",
    linkedin_url: profile?.linkedin_url || "",
    coding_url: profile?.coding_url || "",
    resume_url: profile?.resume_url || "",
  });
});

router.post("/profile", async (req, res) => {
  const {
    alumni_id,
    domain,
    company,
    expertise,
    linkedin_url,
    coding_url,
    resume_url,
  } = req.body;

  await db.query(
    `
    INSERT INTO alumni_profile
      (alumni_id, domain, company, expertise,
       linkedin_url, coding_url, resume_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      domain=VALUES(domain),
      company=VALUES(company),
      expertise=VALUES(expertise),
      linkedin_url=VALUES(linkedin_url),
      coding_url=VALUES(coding_url),
      resume_url=VALUES(resume_url)
    `,
    [
      alumni_id,
      domain,
      company,
      expertise,
      linkedin_url,
      coding_url,
      resume_url,
    ]
  );

  res.json({ message: "Alumni profile updated" });
});
/* =========================
   AVAILABILITY
========================= */

router.post("/availability", async (req, res) => {
  const { alumni_id, date, start_time, end_time } = req.body;

  await db.query(
    `
    INSERT INTO availability (alumni_id, date, start_time, end_time)
    VALUES (?, ?, ?, ?)
    `,
    [alumni_id, date, start_time, end_time]
  );

  res.json({ message: "Availability added" });
});

router.get("/availability/:alumniId", async (req, res) => {
  const [rows] = await db.query(
    `
    SELECT availability_id, date, start_time, end_time
    FROM availability
    WHERE alumni_id=?
    ORDER BY date, start_time
    `,
    [req.params.alumniId]
  );

  res.json(rows);
});

/* =========================
   PENDING REQUESTS
========================= */

router.get("/requests/:alumniId", async (req, res) => {
  const [rows] = await db.query(
    `
    SELECT b.booking_id,
           u.name AS student_name,
           a.date, a.start_time, a.end_time,
           a.availability_id
    FROM bookings b
    JOIN users u ON u.user_id = b.student_id
    JOIN availability a ON a.availability_id = b.availability_id
    WHERE b.alumni_id=? AND b.status='pending'
    `,
    [req.params.alumniId]
  );

  res.json(rows);
});

/* =========================
   APPROVE / REJECT REQUEST
========================= */

router.post("/requests/update", async (req, res) => {
  const { booking_id, status, availability_id } = req.body;

  if (status === "approved") {
    // 1️⃣ get slot details before deleting availability
    const [[slot]] = await db.query(
      `
      SELECT date, start_time, end_time
      FROM availability
      WHERE availability_id=?
      `,
      [availability_id]
    );

    // 2️⃣ generate Google Meet link (mock)
    const meetLink = `https://meet.google.com/${Math.random()
      .toString(36)
      .substring(2, 7)}-${Math.random()
      .toString(36)
      .substring(2, 6)}-${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    // 3️⃣ update booking with slot + meet link
    await db.query(
  `
  UPDATE bookings
  SET status='approved',
      date=?,
      start_time=?,
      end_time=?,
      meet_link=?
  WHERE booking_id=?
  `,
  [
    slot.date,
    slot.start_time,
    slot.end_time,
    meetLink,
    booking_id,
  ]
);


    // 4️⃣ delete availability so it cannot be reused
    await db.query(
      "DELETE FROM availability WHERE availability_id=?",
      [availability_id]
    );
  } else {
    // rejected
    await db.query(
      "UPDATE bookings SET status=? WHERE booking_id=?",
      [status, booking_id]
    );
  }

  res.json({ message: `Booking ${status}` });
});

/* =========================
   UPCOMING SESSIONS
========================= */

router.get("/upcoming/:alumniId", async (req, res) => {
  const [rows] = await db.query(
    `
    SELECT b.booking_id,
           u.name AS student_name,
           b.date, b.start_time, b.end_time
    FROM bookings b
    JOIN users u ON u.user_id = b.student_id
    WHERE b.alumni_id=?
      AND b.status='approved'
    ORDER BY b.date
    `,
    [req.params.alumniId]
  );

  res.json(rows);
});

/* =========================
   COMPLETE SESSION
========================= */

router.post("/sessions/complete", async (req, res) => {
  const { booking_id } = req.body;

  await db.query(
    `
    UPDATE bookings
    SET status='completed'
    WHERE booking_id=?
    `,
    [booking_id]
  );

  res.json({ message: "Session marked as completed" });
});

/* =========================
   ALUMNI DASHBOARD STATS
========================= */

router.get("/dashboard/:alumniId", async (req, res) => {
  const alumniId = req.params.alumniId;

  const [[pending]] = await db.query(
    "SELECT COUNT(*) c FROM bookings WHERE alumni_id=? AND status='pending'",
    [alumniId]
  );

  const [[upcoming]] = await db.query(
    "SELECT COUNT(*) c FROM bookings WHERE alumni_id=? AND status='approved'",
    [alumniId]
  );

  const [[completed]] = await db.query(
    "SELECT COUNT(*) c FROM bookings WHERE alumni_id=? AND status='completed'",
    [alumniId]
  );

  res.json({
    pending: pending.c,
    upcoming: upcoming.c,
    completed: completed.c,
  });
});

export default router;
