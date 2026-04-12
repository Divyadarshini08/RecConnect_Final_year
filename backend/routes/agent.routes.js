/**
 * Agent Routes - All agentic AI endpoints for REConnect.
 * Enhanced with auth validation, input sanitization, and error logging.
 */

import express from "express";
import { orchestrate, intentAgent } from "../agents/orchestrator.agent.js";
import { chatAgent } from "../agents/chat.agent.js";
import { findMatchingAlumni } from "../agents/matching.agent.js";
import db from "../db.js";
import { verifyAuth, authorizeStudent } from "../middleware/auth.middleware.js";
import { validators } from "../utils/validation.js";

const router = express.Router();

// Apply auth to all agent routes
router.use(verifyAuth);

// POST /api/agent/book – Full agentic booking pipeline
router.post("/agent/book", authorizeStudent, async (req, res) => {
  try {
    const { student_id, alumni_id, availability_id, query } = req.body;
    
    // Validate required fields
    if (!student_id || !availability_id) {
      return res.status(400).json({ error: "student_id and availability_id are required" });
    }
    
    // Validate data types
    const validated = validators.bookingRequest({ student_id, alumni_id, availability_id, query });
    
    const result = await orchestrate({
      studentId: validated.student_id,
      alumniId: validated.alumni_id,
      availabilityId: validated.availability_id,
      query: validated.query,
    });
    res.json({ source: "agentic", ...result });
  } catch (err) {
    console.error("[/agent/book] Error:", err.message);
    res.status(500).json({ error: "Agentic booking failed", details: process.env.NODE_ENV === "development" ? err.message : undefined });
  }
});

// POST /api/agent/intent – Classify intent from natural language
router.post("/agent/intent", async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }
    
    const cleanQuery = validators.query(query);
    const intent = await intentAgent(cleanQuery);
    res.json({ source: "intent_agent", intent });
  } catch (err) {
    console.error("[/agent/intent] Error:", err.message);
    res.status(500).json({ error: "Intent classification failed", details: process.env.NODE_ENV === "development" ? err.message : undefined });
  }
});

// POST /api/agent/match – AI-powered alumni matching
router.post("/agent/match", authorizeStudent, async (req, res) => {
  try {
    const { student_id, query } = req.body;
    
    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }
    
    const validatedId = validators.studentId(student_id);
    const cleanQuery = query ? validators.query(query) : null;
    
    const alumni = await findMatchingAlumni(validatedId, cleanQuery);
    res.json({ source: "matching_agent", alumni });
  } catch (err) {
    console.error("[/agent/match] Error:", err.message);
    res.status(500).json({ error: "Matching failed", details: process.env.NODE_ENV === "development" ? err.message : undefined });
  }
});

// POST /api/agent/chat – Conversational AI career advisor (with SSE streaming)
router.post("/agent/chat", authorizeStudent, async (req, res) => {
  try {
    const { student_id, messages } = req.body;
    
    if (!student_id || !messages?.length) {
      return res.status(400).json({ error: "student_id and messages are required" });
    }
    
    // Validate input
    const validatedId = validators.studentId(student_id);
    const validatedMessages = validators.messages(messages);

    if (req.headers.accept === "text/event-stream") {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const stream = await chatAgent(validatedId, validatedMessages, true);
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      const reply = await chatAgent(validatedId, validatedMessages, false);
      res.json({ source: "chat_agent", reply });
    }
  } catch (err) {
    console.error("[/agent/chat] Error:", err.message);
    res.status(500).json({ error: "Chat agent failed", details: process.env.NODE_ENV === "development" ? err.message : undefined });
  }
});

// GET /api/agent/notifications/:userId
router.get("/agent/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can only fetch their own notifications
    if (req.user.id !== Number(userId)) {
      return res.status(403).json({ error: "Unauthorized - you can only view your own notifications" });
    }
    
    const [rows] = await db.query(
      `SELECT notification_id, message, is_read, created_at
       FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("[/agent/notifications] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// POST /api/agent/notifications/read
router.post("/agent/notifications/read", async (req, res) => {
  try {
    const { notification_id } = req.body;
    await db.query("UPDATE notifications SET is_read = 1 WHERE notification_id = ?", [notification_id]);
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// GET /api/agent/metrics – pipeline performance
router.get("/agent/metrics", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT type, AVG(value) AS avg_value, COUNT(*) AS count
       FROM metrics WHERE logged_at > NOW() - INTERVAL 24 HOUR
       GROUP BY type`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

export default router;
