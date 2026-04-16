import db from "../db.js";

export const logMetric = async (type, value) => {
  try {
    await db.query(
      "INSERT INTO metrics (type, value) VALUES (?, ?)",
      [type, value]
    );
  } catch (err) {
    // Silently fail - database might not be available yet
    // In production, use proper logging service
  }
};
