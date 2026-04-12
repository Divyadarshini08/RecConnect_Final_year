import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * STUDENT BOOKING REQUEST
 */
router.post("/request", async (req, res) => {
  const { student_id, availability_id } = req.body;

  const [[slot]] = await db.query(
    "SELECT * FROM availability WHERE availability_id=? AND is_booked=0",
    [availability_id]
  );

  if (!slot) {
    return res.status(400).json({ message: "Slot not available" });
  }

  await db.query(
    `
    INSERT INTO bookings (student_id, alumni_id, availability_id, status)
    VALUES (?, ?, ?, 'pending')
    `,
    [student_id, slot.alumni_id, availability_id]
  );

  res.json({ message: "Booking request sent. Awaiting approval." });
});

export default router;
