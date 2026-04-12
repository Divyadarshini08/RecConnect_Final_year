import db from "../db.js";

export const logMetric = async (type, value) => {
  await db.query(
    "INSERT INTO metrics (type, value) VALUES (?, ?)",
    [type, value]
  );
};
