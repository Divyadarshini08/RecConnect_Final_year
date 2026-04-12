/**
 * Intent Routes - Backward compatible endpoint
 * Replaces old n8n webhook call with direct Claude agent call
 */

import express from "express";
import { intentAgent } from "../agents/orchestrator.agent.js";

const router = express.Router();

router.post("/intent", async (req, res) => {
  try {
    const { query, preferred_slots } = req.body;
    if (!query) return res.status(400).json({ error: "query is required" });

    const intent = await intentAgent(query);

    res.json({
      source: "claude_intent_agent",
      intent,
      preferred_slots,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[/intent] Error:", error.message);
    res.status(500).json({ error: "Intent agent failed", details: error.message });
  }
});

export default router;
