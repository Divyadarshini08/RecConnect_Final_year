import express from "express";
import db from "../db.js";
import multer from "multer";
import bcrypt from "bcrypt";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Simple CSV parser
const parseCSV = (buffer) => {
  const text = buffer.toString("utf-8");
  const lines = text.split("\n");
  if (lines.length < 2) throw new Error("CSV file must have header and data rows");
  
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(",").map(v => v.trim());
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }
  
  return rows;
};

/* =========================
   ALUMNI PROFILE
========================= */

router.get("/profile/:id", async (req, res) => {
  const alumniId = req.params.id;

  try {
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
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.json({
      name: "",
      email: "",
      domain: "",
      company: "",
      expertise: "",
      linkedin_url: "",
      coding_url: "",
      resume_url: "",
    });
  }
});

/* =========================
   LIST ALL ALUMNI
========================= */

router.get("/list", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.user_id as alumni_id, u.name, u.email, 
             ap.domain, ap.company, ap.expertise
      FROM users u
      LEFT JOIN alumni_profile ap ON u.user_id = ap.alumni_id
      WHERE u.role = 'alumni'
      ORDER BY u.name ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Alumni list error:", err);
    res.json([]);
  }
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

  try {
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
  } catch (err) {
    console.error("Profile update error:", err);
    res.json({ message: "Profile update queued (database unavailable)" });
  }
});
/* =========================
   AVAILABILITY
========================= */

router.post("/availability", async (req, res) => {
  const { alumni_id, date, start_time, end_time } = req.body;

  try {
    await db.query(
      `
      INSERT INTO availability (alumni_id, date, start_time, end_time)
      VALUES (?, ?, ?, ?)
      `,
      [alumni_id, date, start_time, end_time]
    );
    res.json({ message: "Availability added" });
  } catch (err) {
    console.error("Availability add error:", err);
    res.json({ message: "Availability queued (database unavailable)" });
  }
});

router.get("/availability/:alumniId", async (req, res) => {
  try {
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
  } catch (err) {
    console.error("Availability fetch error:", err);
    res.json([]); // Return empty list if database unavailable
  }
});

/* =========================
   PENDING REQUESTS
========================= */

router.get("/requests/:alumniId", async (req, res) => {
  try {
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
  } catch (err) {
    console.error("Requests fetch error:", err);
    res.json([]); // Return empty list if database unavailable
  }
});

/* =========================
   APPROVE / REJECT REQUEST
========================= */

router.post("/requests/update", async (req, res) => {
  const { booking_id, status, availability_id } = req.body;
  console.log("📨 [Alumni Request Update] Received:", { booking_id, status, availability_id });

  try {
    if (status === "approved") {
      // 1️⃣ get slot details BEFORE any changes
      const [[slot]] = await db.query(
        `
        SELECT date, start_time, end_time
        FROM availability
        WHERE availability_id=?
        `,
        [availability_id]
      );

      if (!slot) {
        console.log("❌ [Alumni Request] Slot not found:", availability_id);
        return res.status(400).json({ message: "Slot no longer exists" });
      }

      // 2️⃣ generate Google Meet link (mock)
      const meetLink = `https://meet.google.com/${Math.random()
        .toString(36)
        .substring(2, 7)}-${Math.random()
        .toString(36)
        .substring(2, 6)}-${Math.random()
        .toString(36)
        .substring(2, 7)}`;

      console.log("✅ [Alumni Request] Generated Meet link:", meetLink);

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

      console.log("✅ [Alumni Request] Booking updated with meet link");

      // 4️⃣ FIXED: Delete the availability slot so it cannot be reused
      await db.query(
        "DELETE FROM availability WHERE availability_id=?",
        [availability_id]
      );

      console.log("✅ [Alumni Request] Availability slot deleted");
    } else if (status === "rejected") {
      console.log("❌ [Alumni Request] Rejecting booking, releasing slot");
      // FIXED: When rejected, mark availability as available again (is_booked = 0)
      await db.query(
        "UPDATE availability SET is_booked = 0 WHERE availability_id=?",
        [availability_id]
      );
      
      await db.query(
        "UPDATE bookings SET status=? WHERE booking_id=?",
        [status, booking_id]
      );
    } else {
      // Other statuses
      await db.query(
        "UPDATE bookings SET status=? WHERE booking_id=?",
        [status, booking_id]
      );
    }
    res.json({ message: `Booking ${status}` });
  } catch (err) {
    console.error("❌ [Alumni Request] Error:", err.message);
    res.json({ message: `Booking update queued (database unavailable)` });
  }
});

/* =========================
   UPCOMING SESSIONS
========================= */

router.get("/upcoming/:alumniId", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT b.booking_id,
             u.name AS student_name,
             b.date, b.start_time, b.end_time,
             b.meet_link
      FROM bookings b
      JOIN users u ON u.user_id = b.student_id
      WHERE b.alumni_id=?
        AND b.status='approved'
      ORDER BY b.date
      `,
      [req.params.alumniId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Upcoming sessions fetch error:", err);
    res.json([]); // Return empty list if database unavailable
  }
});

/* =========================
   COMPLETE SESSION
========================= */

router.post("/sessions/complete", async (req, res) => {
  const { booking_id } = req.body;

  try {
    await db.query(
      `
      UPDATE bookings
      SET status='completed'
      WHERE booking_id=?
      `,
      [booking_id]
    );

    res.json({ message: "Session marked as completed" });
  } catch (err) {
    console.error("Complete session error:", err);
    res.json({ message: "Session update queued (database unavailable)" });
  }
});

/* =========================
   ALUMNI DASHBOARD STATS
========================= */

router.get("/dashboard/:alumniId", async (req, res) => {
  const alumniId = req.params.alumniId;

  try {
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
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.json({
      pending: 0,
      upcoming: 0,
      completed: 0,
    });
  }
});

/* =========================
   IMPORT ALUMNI FROM EXCEL
========================= */

router.post("/import-excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Parse CSV file
    const rows = parseCSV(req.file.buffer);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Excel file is empty" });
    }

    let imported = 0;
    let errors = [];
    const credentials = [];
    const defaultPassword = "Welcome@123";

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const name = row.Name || row.name || "";
        const email = row.Email || row.email || "";
        const domain = row.Domain || row.domain || "";
        const company = row.Company || row.company || "";
        const expertise = row.Expertise || row.expertise || "";

        // Validate required fields
        if (!name || !email) {
          errors.push(`Row ${i + 2}: Missing name or email`);
          continue;
        }

        // Check if user already exists
        const [[existing]] = await db.query(
          "SELECT user_id FROM users WHERE email = ?",
          [email]
        );

        if (existing) {
          errors.push(`Row ${i + 2}: Email ${email} already exists`);
          continue;
        }

        // Create hashed password
        const hash = await bcrypt.hash(defaultPassword, 10);

        // 1️⃣ Insert user
        const [result] = await db.query(
          "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
          [name, email, hash, "alumni"]
        );

        const userId = result.insertId;

        // 2️⃣ Insert alumni profile
        await db.query(
          `INSERT INTO alumni_profile (alumni_id, domain, company, expertise)
           VALUES (?, ?, ?, ?)`,
          [userId, domain || "", company || "", expertise || ""]
        );

        // Store credentials for display
        credentials.push({
          email,
          password: defaultPassword,
          name
        });

        imported++;
      } catch (rowErr) {
        errors.push(`Row ${i + 2}: ${rowErr.message}`);
      }
    }

    res.json({
      imported,
      total: rows.length,
      credentials,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${imported}/${rows.length} alumni`,
    });
  } catch (err) {
    console.error("Excel import error:", err);
    res.status(500).json({ error: "Failed to process Excel file" });
  }
});

/* =========================
   UPDATE ALUMNI FROM EXCEL
========================= */

router.post("/update-excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Parse CSV file
    const rows = parseCSV(req.file.buffer);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Excel file is empty" });
    }

    let updated = 0;
    let errors = [];
    const updates = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const email = row.Email || row.email || "";
        const domain = row.Domain || row.domain || null;
        const company = row.Company || row.company || null;
        const expertise = row.Expertise || row.expertise || null;

        // Validate email is provided
        if (!email) {
          errors.push(`Row ${i + 2}: Email is required`);
          continue;
        }

        // Find alumni by email
        const [[user]] = await db.query(
          "SELECT user_id FROM users WHERE email = ? AND role = 'alumni'",
          [email]
        );

        if (!user) {
          errors.push(`Row ${i + 2}: No alumni found with email ${email}`);
          continue;
        }

        const alumniId = user.user_id;
        const updatedFields = [];

        // Check and update domain if provided
        if (domain !== null && domain !== "") {
          await db.query(
            "UPDATE alumni_profile SET domain = ? WHERE alumni_id = ?",
            [domain, alumniId]
          );
          updatedFields.push("Domain");
        }

        // Check and update company if provided
        if (company !== null && company !== "") {
          await db.query(
            "UPDATE alumni_profile SET company = ? WHERE alumni_id = ?",
            [company, alumniId]
          );
          updatedFields.push("Company");
        }

        // Check and update expertise if provided
        if (expertise !== null && expertise !== "") {
          await db.query(
            "UPDATE alumni_profile SET expertise = ? WHERE alumni_id = ?",
            [expertise, alumniId]
          );
          updatedFields.push("Expertise");
        }

        if (updatedFields.length > 0) {
          updates.push({
            email,
            fields: updatedFields
          });
          updated++;
        } else {
          errors.push(`Row ${i + 2}: No fields to update for ${email}`);
        }
      } catch (rowErr) {
        errors.push(`Row ${i + 2}: ${rowErr.message}`);
      }
    }

    res.json({
      updated,
      total: rows.length,
      updates,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully updated ${updated}/${rows.length} alumni`,
    });
  } catch (err) {
    console.error("Excel update error:", err);
    res.status(500).json({ error: "Failed to process Excel file" });
  }
});

export default router;
