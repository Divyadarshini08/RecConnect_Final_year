/**
 * NLP Utilities for REConnect
 * Provides NLP processing, data parsing, and text analysis
 */

/**
 * Parse natural language availability strings into database-friendly format
 * E.g., "Monday afternoons" → {days: ['Monday'], times: ['14:00-18:00']}
 */
export function parseAvailabilityString(text) {
  const days = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0
  };
  
  const timeSlots = {
    morning: "09:00-12:00",
    afternoon: "14:00-18:00",
    evening: "18:00-21:00",
    "early morning": "06:00-09:00",
    late: "21:00-23:00"
  };

  const lowerText = text.toLowerCase();
  const parsedDays = [];
  const parsedTimes = [];

  // Extract day references
  Object.entries(days).forEach(([day, num]) => {
    if (lowerText.includes(day)) parsedDays.push(num);
  });

  // Extract time references
  Object.entries(timeSlots).forEach(([time, slot]) => {
    if (lowerText.includes(time)) parsedTimes.push(slot);
  });

  // Default to afternoon if no time specified
  if (parsedTimes.length === 0) parsedTimes.push(timeSlots.afternoon);

  return {
    days: [...new Set(parsedDays)],
    times: [...new Set(parsedTimes)],
    raw: text
  };
}

/**
 * Extract skills and keywords from resume text using Claude
 * Used when processing resume uploads or user descriptions
 */
export async function extractSkillsFromText(text, claudeClient) {
  const systemPrompt = `You are a skills extraction agent. Extract technical skills, soft skills, and certifications from text.
Return ONLY valid JSON:
{
  "technical_skills": ["skill1", "skill2"],
  "soft_skills": ["skill1", "skill2"],
  "certifications": ["cert1"],
  "languages": ["language1"],
  "years_experience": 5
}`;

  try {
    const response = await claudeClient.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
    });

    const text_content = response.content[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(text_content);
  } catch (err) {
    console.error("[Skills Extraction] Failed:", err.message);
    return {
      technical_skills: [],
      soft_skills: [],
      certifications: [],
      languages: [],
      years_experience: 0
    };
  }
}

/**
 * Analyze sentiment and urgency from user message
 * Returns sentiment score (-1 to 1) and urgency level
 */
export async function analyzeSentimentAndUrgency(text, claudeClient) {
  const systemPrompt = `Analyze the sentiment and urgency of this message.
Return ONLY valid JSON:
{
  "sentiment": -1 to 1 (negative to positive),
  "urgency": "low" | "medium" | "high" | "critical",
  "emotion": "description of detected emotion",
  "confidence": 0-1
}`;

  try {
    const response = await claudeClient.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
    });

    const content = response.content[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(content);
  } catch (err) {
    console.error("[Sentiment Analysis] Failed:", err.message);
    return {
      sentiment: 0,
      urgency: "medium",
      emotion: "unknown",
      confidence: 0.5
    };
  }
}

/**
 * Sanitize user IDs before sending to Claude to prevent data leakage
 */
export function sanitizeIdForLLM(id) {
  // Hash the ID or use a placeholder to prevent exposing actual IDs
  return `[STUDENT_${id.toString().slice(-3)}]`;
}

/**
 * Validate and sanitize JSON parse results from Claude
 */
export function safeParseJSON(text, fallback = {}) {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.warn("[JSON Parse] Failed to parse:", err.message);
    return fallback;
  }
}

/**
 * Extract preferred time slots from conversational messages
 */
export function extractTimePreferences(messages) {
  const timePatterns = {
    "early morning": "06:00-09:00",
    "morning": "09:00-12:00",
    "midday": "12:00-14:00",
    "afternoon": "14:00-18:00",
    "evening": "18:00-21:00",
    "late evening": "21:00-23:00",
    "night": "20:00-22:00",
    "weekday": null,
    "weekend": null,
  };

  const combined = messages
    .filter(m => m.role === "user")
    .map(m => m.content)
    .join(" ")
    .toLowerCase();

  const preferences = {
    times: [],
    weekends: combined.includes("weekend"),
    weekdays: combined.includes("weekday"),
  };

  Object.entries(timePatterns).forEach(([pattern, time]) => {
    if (combined.includes(pattern) && time) {
      preferences.times.push(time);
    }
  });

  return preferences;
}

/**
 * Generate conversation summary for chat history
 */
export function generateConversationSummary(messages) {
  if (!messages || messages.length === 0) return "No conversation yet";

  const userMessages = messages
    .filter(m => m.role === "user")
    .map(m => m.content);

  const firstMessage = userMessages[0];
  const topicCount = new Set(
    userMessages.flatMap(m => m.split(" ").filter(word => word.length > 5))
  ).size;

  const summary = `${userMessages.length} messages exchanged. Initial topic: "${firstMessage.substring(0, 60)}..." Discussed ${topicCount} main topics.`;
  
  return summary;
}
