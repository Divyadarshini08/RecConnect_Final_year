/**
 * REConnect Orchestrator Agent
 * ─────────────────────────────────────────────────────────────────
 * A multi-agent system powered by Google Gemini.
 * Enhanced with NLP, security sanitization, and error logging.
 * 
 * Agents:
 *   1. IntentAgent      – classifies user intent from natural language
 *   2. MatchingAgent    – finds best alumni matches using AI scoring
 *   3. BookingAgent     – decides slot selection and booking policy
 *   4. NotificationAgent– drafts personalised notification messages
 *   5. Orchestrator     – coordinates the full pipeline
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "../db.js";
import { logMetric } from "../metrics/metrics.logger.js";
import { sanitizeIdForLLM, safeParseJSON, analyzeSentimentAndUrgency } from "../utils/nlp.utils.js";
import { validators, sanitizeForLLM, validateIntent } from "../utils/validation.js";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ──────────────────────────────────────────────────────────────────
   SHARED HELPER: call Gemini with a system + user prompt
   ────────────────────────────────────────────────────────────────── */
async function callGemini(systemPrompt, userPrompt, maxTokens = 800) {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("ADD_YOUR")) {
      throw new Error("❌ GEMINI_API_KEY not configured in .env file. Get one from https://aistudio.google.com/");
    }

    const start = Date.now();
    
    // Truncate prompts for safety
    const truncatedUserPrompt = userPrompt.substring(0, 3000);
    
    console.log("[callGemini] 📤 Calling Gemini API...");
    
    const model = client.getGenerativeModel({ 
      model: "gemini-1.5-flash"
      // Note: Gemini doesn't support systemInstruction in the same way as Claude
      // We'll prepend the system prompt to the user message instead
    });
    
    // Combine system prompt with user prompt since Gemini doesn't support separate system instruction
    const combinedPrompt = `${systemPrompt}\n\nUser request: ${truncatedUserPrompt}`;
    
    const response = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ text: combinedPrompt }] 
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      }
    });
    
    const latency = Date.now() - start;
    await logMetric("llm_latency_ms", latency).catch(() => {});
    
    const text = response.response.text();
    console.log("[callGemini] ✅ Response received in", latency, "ms");
    
    // Log token usage is handled differently in Gemini, but we log anyway
    await logMetric("llm_response_received", 1).catch(() => {});
    
    return text;
  } catch (err) {
    console.error("[callGemini] ❌ Error:", err.message);
    console.error("[callGemini] Stack:", err.stack);
    throw err;
  }
}

/* ──────────────────────────────────────────────────────────────────
   AGENT 1 – Intent Agent
   Parses natural-language query → structured intent object
   ────────────────────────────────────────────────────────────────── */
export async function intentAgent(query) {
  try {
    // Validate and sanitize input
    const cleanQuery = validators.query(query);
    
    // Simple urgency detection based on keywords (skip complex sentiment analysis)
    const urgentKeywords = ["urgent", "asap", "emergency", "help", "stuck", "critical"];
    const isUrgent = urgentKeywords.some(k => cleanQuery.toLowerCase().includes(k));
    
    const system = `You are an Intent Classification Agent for REConnect, a student-alumni mentorship platform.
Extract structured intent from student queries.
Return ONLY valid JSON (no markdown, no explanation) with these fields:
{
  "intent": one of ["book_session","find_mentor","resume_review","career_advice","technical_help","mock_interview","general"],
  "domain": inferred domain/field (e.g. "software engineering", "finance", "data science") or null,
  "urgency": "high" | "medium" | "low",
  "topics": [array of specific topic keywords],
  "preferred_time": extracted time preference or null,
  "summary": one-sentence summary of what student needs
}`;

    const text = await callGemini(system, `Student query: "${cleanQuery}"`);
    let result = safeParseJSON(text, {
      intent: "book_session",
      domain: null,
      urgency: isUrgent ? "high" : "medium",
      topics: [],
      preferred_time: null,
      summary: cleanQuery.substring(0, 100),
    });
    
    // Validate and normalize intent result
    result = validateIntent(result);
    
    await logMetric("intent_classified", 1).catch(() => {});
    console.log("[IntentAgent] ✅ Intent classified:", result.intent);
    return result;
  } catch (err) {
    console.error("[IntentAgent] Error:", err.message);
    return {
      intent: "book_session",
      domain: null,
      urgency: "medium",
      topics: [],
      preferred_time: null,
      summary: query.substring(0, 100),
    };
  }
}

/* ──────────────────────────────────────────────────────────────────
   AGENT 2 – Matching Agent
   Scores alumni against student intent and returns ranked list
   ────────────────────────────────────────────────────────────────── */
export async function matchingAgent(studentId, intent) {
  // Fetch student profile
  const [[student]] = await db.query(
    `SELECT sp.skills, sp.interests, u.name
     FROM student_profile sp
     JOIN users u ON u.user_id = sp.student_id
     WHERE sp.student_id = ?`,
    [studentId]
  );

  if (!student) return [];

  // Fetch available alumni with open slots
  // FIXED: Changed from INNER JOIN to LEFT JOIN to include alumni even without slots
  const [alumni] = await db.query(
    `SELECT DISTINCT
       u.user_id AS alumni_id,
       u.name,
       ap.domain,
       ap.company,
       ap.expertise,
       COUNT(CASE WHEN av.availability_id IS NOT NULL AND av.is_booked = 0 THEN 1 END) AS free_slots
     FROM users u
     JOIN alumni_profile ap ON ap.alumni_id = u.user_id
     LEFT JOIN availability av ON av.alumni_id = u.user_id AND av.is_booked = 0
     WHERE u.role = 'alumni'
     GROUP BY u.user_id`
  );

  if (!alumni.length) return [];

  // Ask Claude to rank and score the alumni
  const system = `You are an AI Matching Agent for REConnect mentorship platform.
Your job is to rank alumni profiles against a student's needs and return a JSON array.
Return ONLY valid JSON array (no markdown) like:
[
  { "alumni_id": 1, "match_score": 92, "match_reason": "...", "recommended": true },
  ...
]
Score from 0-100. Consider: domain match, expertise relevance, company prestige for career goals, slot availability.`;

  // Sanitize student data for safe LLM processing
  const sanitizedStudent = {
    name: student.name?.substring(0, 50) || "Student",
    skills: student.skills?.substring(0, 200) || "general",
    interests: student.interests?.substring(0, 200) || "general"
  };
  
  const userPrompt = `Student profile:
- Skills: ${sanitizedStudent.skills}
- Interests: ${sanitizedStudent.interests}

Student need (detected intent):
- Intent: ${intent.intent}
- Domain wanted: ${intent.domain || "any"}
- Topics: ${intent.topics.slice(0, 5).join(", ") || "general"}
- Summary: ${intent.summary.substring(0, 100)}

Alumni candidates:
${alumni.map(a =>
  `Candidate ${a.alumni_id}: ${a.name} | ${a.domain} at ${a.company} | Expertise: ${a.expertise?.substring(0, 100) || "general"} | Free slots: ${a.free_slots}`
).join("\n").substring(0, 1500)}

Rank all alumni by connection strength. Mark recommended:true only for score >= 70.`;

  const text = await callGemini(system, userPrompt, 1200);

  try {
    const rankings = safeParseJSON(text, []);
    
    if (!Array.isArray(rankings)) {
      console.warn("[MatchingAgent] Invalid rankings format, using fallback");
      throw new Error("Invalid JSON format");
    }

    // Merge scores back into alumni array with data minimization
    const scored = alumni.map(a => {
      const rank = rankings.find(r => r.alumni_id === a.alumni_id) || {};
      return {
        alumni_id: a.alumni_id,
        name: a.name?.substring(0, 100) || "Alumni",
        domain: a.domain?.substring(0, 100) || null,
        company: a.company?.substring(0, 100) || null,
        free_slots: a.free_slots,
        match_score: Math.min(100, Math.max(0, rank.match_score || 50)),
        match_reason: (rank.match_reason || "General mentorship").substring(0, 200),
        recommended: rank.recommended === true,
      };
    }).sort((a, b) => b.match_score - a.match_score);

    await logMetric("alumni_ranked", scored.length).catch(() => {});
    return scored;
  } catch (err) {
    console.error("[MatchingAgent] JSON parse failed:", err.message);
    return alumni.map(a => ({
      alumni_id: a.alumni_id,
      name: a.name?.substring(0, 100) || "Alumni",
      domain: a.domain?.substring(0, 100) || null,
      company: a.company?.substring(0, 100) || null,
      free_slots: a.free_slots,
      match_score: 50,
      recommended: false,
    }));
  }
}

/* ──────────────────────────────────────────────────────────────────
   AGENT 3 – Booking Policy Agent
   Validates booking, applies policies, selects best slot
   ────────────────────────────────────────────────────────────────── */
export async function bookingAgent(studentId, alumniId, availabilityId, intent) {
  try {
    // Validate inputs
    studentId = validators.studentId(studentId);
    alumniId = validators.alumniId(alumniId);
    availabilityId = validators.availabilityId(availabilityId);
    
    // Check slot availability
    const [[slot]] = await db.query(
      `SELECT av.*, u.name AS alumni_name, ap.domain, ap.company
       FROM availability av
       JOIN users u ON u.user_id = av.alumni_id
       JOIN alumni_profile ap ON ap.alumni_id = av.alumni_id
       WHERE av.availability_id = ? AND av.is_booked = 0`,
      [availabilityId]
    );

    if (!slot) {
      return { approved: false, reason: "Slot no longer available", policy: "slot_conflict" };
    }

    // Check if student already has a pending/approved booking with this alumni
    const [[existing]] = await db.query(
      `SELECT COUNT(*) AS c FROM bookings
       WHERE student_id = ? AND alumni_id = ? AND status IN ('pending','approved')`,
      [studentId, alumniId]
    );

    if (existing.c > 0) {
      return { approved: false, reason: "You already have an active session with this alumni", policy: "duplicate_booking" };
    }
    
    // NEW: Check for time conflicts (double-booking prevention)
    const [[timeConflict]] = await db.query(
      `SELECT COUNT(*) AS c FROM bookings b
       JOIN availability av ON av.availability_id = b.availability_id
       WHERE b.student_id = ? 
       AND DATE(av.date) = DATE(?)
       AND (
         (TIME(av.start_time) < TIME(?)  AND TIME(av.end_time) > TIME(?))
         OR 
         (TIME(av.start_time) < TIME(?) AND TIME(av.end_time) > TIME(?))
       )
       AND b.status IN ('pending', 'approved')
       AND b.booking_id != ?`,
      [
        studentId,
        slot.date,
        slot.end_time,
        slot.start_time,
        slot.start_time,
        slot.end_time,
        availabilityId
      ]
    );
    
    if (timeConflict.c > 0) {
      return { approved: false, reason: "Time conflict with another booking", policy: "time_conflict" };
    }

  // Let Claude evaluate booking appropriateness
  const system = `You are a Booking Policy Agent for REConnect mentorship platform.
Evaluate whether this booking should proceed based on context.
Return ONLY valid JSON:
{
  "approved": true/false,
  "confidence": 0-100,
  "policy": "policy_name_snake_case",
  "reason": "brief explanation",
  "priority": "high"|"medium"|"low",
  "suggested_message": "message to student about booking"
}`;

    // Sanitize slot data for Claude
    const sanitizedSlot = {
      alumni_name: slot.alumni_name?.substring(0, 50) || "Mentor",
      domain: slot.domain?.substring(0, 100) || "general",
      company: slot.company?.substring(0, 100) || "unknown",
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time
    };
    
    const userPrompt = `Booking request evaluation:
- Alumni: ${sanitizedSlot.alumni_name} (${sanitizedSlot.domain} at ${sanitizedSlot.company})
- Slot: ${sanitizedSlot.date} ${sanitizedSlot.start_time}–${sanitizedSlot.end_time}
- Session intent: ${intent?.intent || "book_session"}
- Topics: ${intent?.topics?.slice(0, 3).join(", ") || "general"}
- Summary: ${intent?.summary?.substring(0, 100) || "session booking"}

Evaluate: Is this a valid booking? Check policy compliance.`;

    const text = await callGemini(system, userPrompt);

    try {
      const decision = safeParseJSON(text, {
        approved: true,
        confidence: 80,
        policy: "standard_booking",
        reason: "Booking looks valid",
        priority: "medium",
        suggested_message: "Your booking request has been sent!",
      });
      decision.slot = sanitizedSlot;
      await logMetric("booking_approved", decision.approved ? 1 : 0).catch(() => {});
      return decision;
    } catch (err) {
      console.error("[BookingAgent] JSON parse failed:", err.message);
      return {
        approved: true,
        confidence: 80,
        policy: "standard_booking",
        reason: "Booking looks valid",
        priority: "medium",
        suggested_message: "Your booking request has been sent!",
        slot: sanitizedSlot,
      };
    }
  } catch (err) {
    console.error("[BookingAgent] Error:", err.message);
    return {
      approved: false,
      reason: "Booking validation failed",
      policy: "system_error"
    };
  }
}

/* ──────────────────────────────────────────────────────────────────
   AGENT 4 – Notification Agent
   Drafts personalised notification messages
   ────────────────────────────────────────────────────────────────── */
export async function notificationAgent(recipientId, eventType, context) {
  try {
    recipientId = validators.studentId(recipientId);
    
    const system = `You are a Notification Agent for REConnect mentorship platform.
Write warm, professional, concise notification messages for students and alumni.
Return ONLY valid JSON:
{ "message": "the notification text (max 200 chars)", "emoji": "relevant emoji" }`;

    // Sanitize context data
    const sanitizedContext = {
      student_name: context.student_name?.substring(0, 50) || "Student",
      alumni_name: context.alumni_name?.substring(0, 50) || "Alumni",
      date: context.date || "upcoming",
      time: context.time || "TBD",
      topic: context.topic?.substring(0, 100) || "mentorship"
    };

    const userPrompt = `Event: ${eventType}
Context: ${JSON.stringify(sanitizedContext)}
Write a professional notification message.`;

    const text = await callGemini(system, userPrompt, 300);

    let message = `You have a new update on REConnect.`;
    let emoji = "🔔";

    try {
      const result = safeParseJSON(text, {});
      message = result.message || message;
      emoji = result.emoji || emoji;
    } catch (err) {
      console.error("[NotificationAgent] JSON parse failed:", err.message);
    }
    
    // Enforce 200 character limit
    message = validators.notificationMessage(message);
    const finalMessage = `${emoji} ${message}`;

    // Save to DB
    await db.query(
      "INSERT INTO notifications(user_id, message, created_at) VALUES (?, ?, NOW())",
      [recipientId, finalMessage]
    );
    
    await logMetric("notification_sent", 1).catch(() => {});
    return { message, emoji };
  } catch (err) {
    console.error("[NotificationAgent] Error:", err.message);
    return { message: "Update available", emoji: "🔔" };
  }
}

/* ──────────────────────────────────────────────────────────────────
   ORCHESTRATOR – Full agentic pipeline
   ────────────────────────────────────────────────────────────────── */
export async function orchestrate({ studentId, alumniId, availabilityId, query, preferred_slots }) {
  const pipelineStart = Date.now();

  try {
    console.log("🎯 [Orchestrator] Starting pipeline:", { studentId, alumniId, availabilityId, query: query?.substring(0, 50) });
    
    // Validate input parameters
    studentId = validators.studentId(studentId);
    query = query ? validators.query(query) : "book a mentorship session";
    console.log("✅ [Orchestrator] Validated inputs");
    
    // ── Step 1: Classify intent with NLP
    const intent = await intentAgent(query);
    console.log("✅ [Orchestrator] Intent classified:", intent.intent);
    await logMetric("agent_intent_classified", 1).catch(() => {});

    // ── Step 2: Find + rank matching alumni (if no specific alumni targeted)
    let matchedAlumni = null;
    if (!alumniId) {
      console.log("🔍 [Orchestrator] Finding alumni matches...");
      const ranked = await matchingAgent(studentId, intent);
      matchedAlumni = ranked[0] || null;
      alumniId = matchedAlumni?.alumni_id;
      console.log("✅ [Orchestrator] Matched alumni:", alumniId);
    } else {
      console.log("✅ [Orchestrator] Alumni already specified:", alumniId);
    }

    // ── Step 3: Booking policy check with time conflict detection
    let bookingDecision = null;
    if (availabilityId && alumniId) {
      console.log("📋 [Orchestrator] Checking booking policy...");
      bookingDecision = await bookingAgent(studentId, alumniId, availabilityId, intent);
      console.log("📋 [Orchestrator] Booking decision:", { approved: bookingDecision.approved, policy: bookingDecision.policy });

      if (bookingDecision.approved) {
        console.log("💾 [Orchestrator] Creating booking in database...");
        // Create the booking
        const [result] = await db.query(
          `INSERT INTO bookings (student_id, alumni_id, availability_id, status, created_at)
           VALUES (?, ?, ?, 'pending', NOW())`,
          [studentId, alumniId, availabilityId]
        );
        console.log("✅ [Orchestrator] Booking created, booking_id:", result.insertId);
        
        // Update availability slot as booked
        await db.query(
          `UPDATE availability SET is_booked = 1 WHERE availability_id = ?`,
          [availabilityId]
        );
        console.log("✅ [Orchestrator] Marked availability as booked");

        // ── Step 4: Send notifications
        const slot = bookingDecision.slot;
        const [[alumniUser]] = await db.query(
          "SELECT name FROM users WHERE user_id=? LIMIT 1",
          [alumniId]
        ).catch(() => [{}]);
        const [[studentUser]] = await db.query(
          "SELECT name FROM users WHERE user_id=? LIMIT 1",
          [studentId]
        ).catch(() => [{}]);

        console.log("📧 [Orchestrator] Sending notifications to alumni:", alumniId, "and student:", studentId);
        
        // Notify alumni of new booking request
        await notificationAgent(alumniId, "new_booking_request", {
          student_name: studentUser?.name,
          date: slot.date,
          time: slot.start_time,
          topic: intent.summary,
        }).catch(err => console.error("[Orchestrator] Alumni notification failed:", err.message));

        // Notify student booking was sent
        await notificationAgent(studentId, "booking_sent", {
          alumni_name: alumniUser?.name,
          date: slot.date,
          time: slot.start_time,
        }).catch(err => console.error("[Orchestrator] Student notification failed:", err.message));
        
        console.log("✅ [Orchestrator] Notifications sent");
        await logMetric("booking_created", 1).catch(() => {});
      } else {
        console.log("❌ [Orchestrator] Booking rejected:", bookingDecision.reason);
      }
    } else {
      console.log("⚠️ [Orchestrator] Missing availabilityId or alumniId, skipping booking");
    }

    const pipelineTime = Date.now() - pipelineStart;
    await logMetric("orchestrator_pipeline_ms", pipelineTime).catch(() => {});
    console.log("⏱️ [Orchestrator] Pipeline completed in", pipelineTime, "ms");

    return {
      success: bookingDecision?.approved || false,
      intent,
      matched_alumni: matchedAlumni,
      booking: bookingDecision,
      pipeline_ms: pipelineTime,
    };

  } catch (err) {
    console.error("[Orchestrator] Pipeline error:", err.message);
    await logMetric("orchestrator_error", 1).catch(() => {});
    throw err;
  }
}
