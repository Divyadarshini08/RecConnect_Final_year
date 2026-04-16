import express from "express";
import db from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * REGISTER
 */
console.log("✅ AUTH ROUTES FILE LOADED");
router.post("/register", async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    skills,
    interests,
    domain,
    company,
    expertise
  } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const hash = await bcrypt.hash(password, 10);

    // 1️⃣ Insert user
    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, hash, role]
    );

    const userId = result.insertId;

    // 2️⃣ Student profile
    if (role === "student" && skills && interests) {
      await db.query(
        `
        INSERT INTO student_profile (student_id, skills, interests)
        VALUES (?, ?, ?)
        `,
        [userId, skills, interests]
      );
    }

    // 3️⃣ Alumni profile
    if (role === "alumni" && domain && company && expertise) {
      await db.query(
        `
        INSERT INTO alumni_profile (alumni_id, domain, company, expertise)
        VALUES (?, ?, ?, ?)
        `,
        [userId, domain, company, expertise]
      );
    }

    res.status(201).json({
      user_id: userId,
      role,
      name,
      email,
      token: jwt.sign(
        { id: userId, role, email },
        process.env.JWT_SECRET || "default-secret-change-me",
        { expiresIn: "7d" }
      )
    });
  } catch (err) {
    console.error("Registration error:", err);
    
    // Handle specific database errors
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "Email already registered" });
    }
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: "Database connection failed. Please try again later." });
    }
    
    res.status(400).json({ message: "Registration failed: " + err.message });
  }
});

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [[user]] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      user_id: user.user_id,
      role: user.role,
      name: user.name,
      email: user.email,
      token: jwt.sign(
        { id: user.user_id, role: user.role, email: user.email },
        process.env.JWT_SECRET || "default-secret-change-me",
        { expiresIn: "7d" }
      )
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});


export default router;
