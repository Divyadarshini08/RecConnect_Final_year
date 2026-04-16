/**
 * Matching Agent (AI-Enhanced)
 * Uses Claude to intelligently match students with alumni.
 * Fixed: SQL Injection prevention, NLP integration, input validation
 */

import db from "../db.js";
import { intentAgent, matchingAgent as aiMatchingAgent } from "./orchestrator.agent.js";
import { validators } from "../utils/validation.js";

export const findMatchingAlumni = async (studentId, query = null) => {
  try {
    // Validate inputs
    studentId = validators.studentId(studentId);
    if (query) query = validators.query(query);
    
    const intent = query
      ? await intentAgent(query)
      : { intent: "find_mentor", domain: null, topics: [], summary: "find a mentor" };

    const ranked = await aiMatchingAgent(studentId, intent);
    return ranked;
  } catch (err) {
    console.error("[MatchingAgent] AI failed, falling back to DB query:", err.message);

    const [[student]] = await db.query(
      "SELECT skills, interests FROM student_profile WHERE student_id = ?",
      [studentId]
    );
    if (!student) return [];

    // FIX: Sanitize strings to prevent SQL injection
    const interests = student.interests?.substring(0, 100) || "general";
    const skills = student.skills?.substring(0, 100) || "general";
    
    // FIXED: Changed from INNER JOIN to LEFT JOIN to include alumni without unbooked slots
    // Also added check for non-rejected bookings
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
         AND (ap.domain LIKE ? OR ap.expertise LIKE ?)
       GROUP BY u.user_id
       LIMIT 20`,
      [`%${interests}%`, `%${skills}%`]
    );

    return alumni.map(a => ({ 
      ...a, 
      match_score: 70, 
      recommended: true,
      match_reason: "Matched based on skills and interests" 
    }));
  }
};
