/**
 * Chat Agent – Conversational AI for REConnect
 * Handles multi-turn conversations to help students
 * find the right mentor, understand their options,
 * and get career/academic guidance.
 * Enhanced with: conversation memory, sentiment analysis, NLP
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "../db.js";
import { logMetric } from "../metrics/metrics.logger.js";
import { analyzeSentimentAndUrgency, generateConversationSummary } from "../utils/nlp.utils.js";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    
    // Analyze sentiment of latest user message to improve context (skip if Gemini client)
    let sentimentContext = "";
    try {
      const lastUserMessage = messages.filter(m => m.role === "user").pop();
      if (lastUserMessage) {
        // For Gemini, we'll skip complex sentiment analysis
        // Just check for urgent keywords
        const urgentKeywords = ["urgent", "asap", "emergency", "help", "stuck", "critical"];
        const isUrgent = urgentKeywords.some(k => lastUserMessage.content.toLowerCase().includes(k));
        if (isUrgent) {
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

    const model = client.getGenerativeModel({ 
      model: "gemini-1.5-flash"
      // Note: Gemini doesn't support systemInstruction in the same way - we'll prepend to user message
    });

    // Convert messages to Gemini format: handle conversation history properly
    // Gemini requires: first message must be from "user", alternating user/model
    const history = [];
    
    // Build history from messages (excluding the last one)
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      if (!msg.content) continue; // Skip empty messages
      
      const role = msg.role === "user" ? "user" : "model";
      
      // If history is empty, ONLY add if this is a user message
      if (history.length === 0 && role !== "user") {
        continue;
      }
      
      // Add to history
      history.push({
        role,
        parts: [{ text: msg.content.substring(0, 5000) }]
      });
    }
    
    // Validate history starts with user (double-check)
    if (history.length > 0 && history[0].role !== "user") {
      console.warn("[ChatAgent] ⚠️ History doesn't start with user, clearing history");
      history.length = 0; // Clear invalid history
    }

    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content?.substring(0, 5000) || lastMessage?.content;
    
    // Validate user message is not empty
    if (!userMessage || userMessage.trim().length === 0) {
      console.error("[ChatAgent] ❌ Empty user message received");
      return "Please provide a message to continue the conversation.";
    }
    
    // Prepend system prompt to first user message for context
    const systemContext = `${systemPrompt}\n\n`;
    const enhancedUserMessage = history.length === 0 ? 
      systemContext + userMessage : 
      userMessage;

    // Use startChat for multi-turn conversation if there's valid history
    let response;
    if (history.length > 0) {
      console.log("[ChatAgent] 💬 Using chat history with", history.length, "messages");
      const chat = model.startChat({ history });
      response = await chat.sendMessage(enhancedUserMessage);
    } else {
      // No history, just send the message with system context
      console.log("[ChatAgent] 📝 Starting new conversation");
      response = await model.generateContent({
        contents: [{ 
          role: "user", 
          parts: [{ text: enhancedUserMessage }] 
        }],
        generationConfig: {
          maxOutputTokens: 600,
          temperature: 0.7,
        }
      });
    }

    const latency = Date.now() - start;
    await logMetric("chat_agent_latency_ms", latency).catch(() => {});
    
    // Log conversation data for analytics
    const summary = generateConversationSummary(messages);
    await logMetric("chat_conversation_summary", 1).catch(() => {});
    
    await logMetric("chat_agent_call", 1).catch(() => {});
    
    const responseText = response.response.text();
    console.log("[ChatAgent] ✅ Response sent:", responseText.substring(0, 50));
    return responseText;
  } catch (err) {
    console.error("[ChatAgent] Error:", err.message);
    // Return helpful fallback message
    return "I apologize for the technical difficulty. Please try again in a moment. In the meantime, you can explore our 'Find Alumni' page to browse available mentors.";
  }
}
