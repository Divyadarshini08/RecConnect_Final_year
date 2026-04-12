/**
 * Chat Agent – Conversational AI for REConnect
 * Handles multi-turn conversations to help students
 * find the right mentor, understand their options,
 * and get career/academic guidance.
 * Enhanced with: conversation memory, sentiment analysis, NLP
 */

import Anthropic from "@anthropic-ai/sdk";
import db from "../db.js";
import { logMetric } from "../metrics/metrics.logger.js";
import { analyzeSentimentAndUrgency, generateConversationSummary } from "../utils/nlp.utils.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Main chat handler – streams or returns a full response
 * based on student context + conversation history
 */
export async function chatAgent(studentId, messages, streaming = false) {
  const start = Date.now();

  try {
    // Build context about the student
    let studentContext = "No profile yet.";
    try {
      const [[profile]] = await db.query(
        `SELECT sp.skills, sp.interests, u.name
         FROM student_profile sp
         JOIN users u ON u.user_id = sp.student_id
         WHERE sp.student_id = ?`,
        [studentId]
      );
      if (profile) {
        studentContext = `Name: ${profile.name} | Skills: ${profile.skills?.substring(0, 100)} | Interests: ${profile.interests?.substring(0, 100)}`;
      }
    } catch (err) {
      console.warn("[ChatAgent] Failed to load student profile:", err.message);
    }

    // Fetch available alumni for context
    let alumniContext = "";
    try {
      const [alumni] = await db.query(
        `SELECT u.name, ap.domain, ap.company, ap.expertise, COUNT(av.availability_id) AS slots
         FROM users u
         JOIN alumni_profile ap ON ap.alumni_id = u.user_id
         JOIN availability av ON av.alumni_id = u.user_id
         WHERE u.role = 'alumni' AND av.is_booked = 0
         GROUP BY u.user_id
         LIMIT 8`
      );
      if (alumni.length) {
        alumniContext = "\n\nCurrently available alumni:\n" +
          alumni.map(a => `• ${a.name} – ${a.domain} at ${a.company} (${a.expertise?.substring(0, 50)}) | ${a.slots} slots`).join("\n");
      }
    } catch (err) {
      console.warn("[ChatAgent] Failed to load alumni:", err.message);
    }
    
    // Analyze sentiment of latest user message to improve context
    let sentimentContext = "";
    try {
      const lastUserMessage = messages.filter(m => m.role === "user").pop();
      if (lastUserMessage) {
        const sentiment = await analyzeSentimentAndUrgency(lastUserMessage.content, client);
        if (sentiment.urgency === "high" || sentiment.urgency === "critical") {
          sentimentContext = "\n[Note: Student appears urgent or stressed. Prioritize quick, actionable advice.]";
        }
      }
    } catch (err) {
      console.warn("[ChatAgent] Sentiment analysis failed:", err.message);
    }

    const systemPrompt = `You are REConnect's AI Career Advisor — a warm, knowledgeable assistant helping students connect with alumni mentors.

Student context: ${studentContext}${alumniContext}${sentimentContext}

Your capabilities:
- Help students clarify what kind of mentorship they need
- Recommend specific alumni based on their goals
- Explain how the booking process works
- Give career guidance and preparation tips
- Help students write good session descriptions
- Track conversation continuity and reference previous topics

Guidelines:
- Be conversational, warm, and encouraging
- Ask clarifying questions to understand their needs
- Suggest specific alumni by name when relevant
- Keep responses concise but helpful (2-4 paragraphs max)
- If student wants to book, guide them to the "Find Alumni" page
- Never make up information about alumni not listed above
- Remember what student shared earlier in conversation
- If student seems stressed or urgent, be extra supportive`;

    const apiMessages = messages.map(m => ({
      role: m.role,
      content: m.content?.substring(0, 5000) || m.content,
    }));

    if (streaming) {
      const stream = await client.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        system: systemPrompt,
        messages: apiMessages,
      });
      await logMetric("chat_agent_call", 1).catch(() => {});
      return stream;
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: systemPrompt,
      messages: apiMessages,
    });

    const latency = Date.now() - start;
    await logMetric("chat_agent_latency_ms", latency).catch(() => {});
    
    // Log conversation data for analytics
    const summary = generateConversationSummary(messages);
    await logMetric("chat_conversation_summary", 1).catch(() => {});
    
    return response.content[0].text;
  } catch (err) {
    console.error("[ChatAgent] Error:", err.message);
    // Return helpful fallback message
    return "I apologize for the technical difficulty. Please try again in a moment. In the meantime, you can explore our 'Find Alumni' page to browse available mentors.";
  }
}
