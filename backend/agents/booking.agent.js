import db from "../db.js";

export const createBooking = async (studentId, availabilityId) => {
  const [[slot]] = await db.query(
    "SELECT * FROM availability WHERE availability_id=? AND is_booked=false",
    [availabilityId]
  );
  if (!slot) return false;

  await db.query(
    "INSERT INTO bookings(student_id, alumni_id, availability_id, status) VALUES (?, ?, ?, 'pending')",
    [studentId, slot.alumni_id, availabilityId]
  );

  return true;
};
