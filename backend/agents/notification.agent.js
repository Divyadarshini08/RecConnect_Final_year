import db from "../db.js";

/**
 * Notification Agent (Node-only baseline)
 */
export const sendNotification = async (userId, message) => {
  await db.query(
    "INSERT INTO notifications(user_id, message) VALUES (?, ?)",
    [userId, message]
  );
};
