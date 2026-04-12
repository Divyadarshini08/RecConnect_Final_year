import bcrypt from "bcrypt";
import db from "../db.js";

export const authenticateUser = async (email, password) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  if (rows.length === 0) return null;

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  return isMatch ? user : null;
};
