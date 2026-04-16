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
 * Extract skills and keywords from resume text
 * Uses simple keyword matching (no API calls needed)
 */
export async function extractSkillsFromText(text) {
  const lowerText = text.toLowerCase();
  
  // Predefined skill lists
  const technicalSkillsList = [
    "javascript", "python", "java", "c++", "c#", "php", "ruby", "swift", "kotlin",
    "react", "vue", "angular", "node.js", "express", "django", "flask", "spring",
    "sql", "mongodb", "postgresql", "mysql", "firebase", "aws", "azure", "gcp",
    "docker", "kubernetes", "git", "jenkins", "latex", "html", "css", "api", "rest",
    "graphql", "microservices", "agile", "scrum", "machine learning", "ai", "tensorflow",
    "pandas", "numpy", "scikit-learn", "data science"
  ];
  
  const softSkillsList = [
    "leadership", "communication", "teamwork", "problem-solving", "critical thinking",
    "project management", "time management", "adaptability", "creativity", "decision making",
    "public speaking", "negotiation", "customer service", "mentoring", "collaboration"
  ];
  
  const certificationsList = [
    "aws", "azure", "gcp", "cissp", "comptia", "ccna", "scrum", "pmp", "acm",
    "java certified", "microsoft", "linux", "kubernetes"
  ];
  
  const languagesList = [
    "english", "spanish", "french", "german", "mandarin", "hindi", "arabic",
    "portuguese", "russian", "japanese", "korean", "italian", "dutch"
  ];
  
  // Extract skills by keyword matching
  const technical_skills = technicalSkillsList.filter(skill => lowerText.includes(skill));
  const soft_skills = softSkillsList.filter(skill => lowerText.includes(skill));
  const certifications = certificationsList.filter(cert => lowerText.includes(cert));
  const languages = languagesList.filter(lang => lowerText.includes(lang));
  
  // Extract years of experience from text
  const expMatch = text.match(/(\d+)\s*[-+]?\s*years?\s*(?:of\s*)?(?:experience|exp)/i);
  const years_experience = expMatch ? parseInt(expMatch[1]) : 0;
  
  return {
    technical_skills: [...new Set(technical_skills)],
    soft_skills: [...new Set(soft_skills)],
    certifications: [...new Set(certifications)],
    languages: [...new Set(languages)],
    years_experience
  };
}

/**
 * Analyze sentiment and urgency from user message
 * Returns sentiment score (-1 to 1) and urgency level
 * Uses simple keyword-based analysis (no API calls)
 */
export async function analyzeSentimentAndUrgency(text) {
  const lowerText = text.toLowerCase();
  
  // Sentiment keywords
  const positiveSentiments = ["great", "love", "excellent", "perfect", "happy", "glad", "thanks", "appreciated"];
  const negativeSentiments = ["hate", "worst", "terrible", "awful", "bad", "sad", "angry", "frustrated", "stuck"];
  
  // Urgency keywords
  const urgentKeywords = ["urgent", "asap", "emergency", "critical", "immediate", "help", "stuck", "blocked", "failure"];
  const criticalKeywords = ["emergency", "critical", "life-threatening", "urgent help"];
  
  // Calculate sentiment
  const positiveCount = positiveSentiments.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeSentiments.filter(w => lowerText.includes(w)).length;
  const sentiment = (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);
  
  // Determine urgency
  let urgency = "low";
  if (criticalKeywords.some(k => lowerText.includes(k))) {
    urgency = "critical";
  } else if (urgentKeywords.some(k => lowerText.includes(k))) {
    urgency = "high";
  } else if (text.includes("?")) {
    urgency = "medium";
  }
  
  // Determine emotion
  let emotion = "neutral";
  if (sentiment > 0.5) emotion = "positive";
  else if (sentiment < -0.5) emotion = "negative";
  else if (sentiment > 0.2) emotion = "somewhat positive";
  else if (sentiment < -0.2) emotion = "somewhat negative";
  
  return {
    sentiment: Math.max(-1, Math.min(1, sentiment)),
    urgency,
    emotion,
    confidence: Math.min(1, (positiveCount + negativeCount) * 0.3 + 0.3)
  };
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
