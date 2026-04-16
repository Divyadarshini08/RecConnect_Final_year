import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * STUDENT BOOKING REQUEST (Simple fallback)
 */
router.post("/request", async (req, res) => {
  try {
    const { student_id, alumni_id, availability_id } = req.body;
    console.log("📨 [/booking/request] Received:", { student_id, alumni_id, availability_id });

    if (!student_id || !alumni_id || !availability_id) {
      return res.status(400).json({ error: "Missing required fields: student_id, alumni_id, availability_id" });
    }

    // Get slot details
    const [[slot]] = await db.query(
      "SELECT * FROM availability WHERE availability_id=? AND is_booked=0",
      [availability_id]
    );

    if (!slot) {
      console.log("❌ [/booking/request] Slot not available:", availability_id);
      return res.status(400).json({ error: "Slot not available or already booked" });
    }

    console.log("✅ [/booking/request] Slot found:", slot);

    // Mark slot as booked
    await db.query(
      "UPDATE availability SET is_booked = 1 WHERE availability_id = ?",
      [availability_id]
    );
    console.log("✅ [/booking/request] Marked slot as booked");

    // Create booking
    const [result] = await db.query(
      `INSERT INTO bookings (student_id, alumni_id, availability_id, status, created_at)
       VALUES (?, ?, ?, 'pending', NOW())`,
      [student_id, alumni_id, availability_id]
    );
    console.log("✅ [/booking/request] Booking created:", result.insertId);

    res.json({ 
      success: true,
      message: "Booking request sent. Awaiting approval.",
      booking_id: result.insertId,
      student_id,
      alumni_id,
      availability_id
    });
  } catch (err) {
    console.error("❌ [/booking/request] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
