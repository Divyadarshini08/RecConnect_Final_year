/**
 * Input Validation & Sanitization
 * Ensures all user inputs are safe before processing
 */

export const validators = {
  /**
   * Validate student_id format
   */
  studentId: (id) => {
    if (!id || typeof id !== "number") {
      throw new Error("Invalid student_id: must be a number");
    }
    return id;
  },

  /**
   * Validate alumni_id format
   */
  alumniId: (id) => {
    if (!id || typeof id !== "number") {
      throw new Error("Invalid alumni_id: must be a number");
    }
    return id;
  },

  /**
   * Validate availability_id format
   */
  availabilityId: (id) => {
    if (!id || typeof id !== "number") {
      throw new Error("Invalid availability_id: must be a number");
    }
    return id;
  },

  /**
   * Validate query string (max 2000 chars)
   */
  query: (text) => {
    if (!text || typeof text !== "string") {
      throw new Error("Query must be a non-empty string");
    }
    if (text.length > 2000) {
      throw new Error("Query too long (max 2000 characters)");
    }
    return text.trim();
  },

  /**
   * Validate message content (max 5000 chars)
   */
  message: (text) => {
    if (!text || typeof text !== "string") {
      throw new Error("Message must be a non-empty string");
    }
    if (text.length > 5000) {
      throw new Error("Message too long (max 5000 characters)");
    }
    return text.trim();
  },

  /**
   * Validate messages array for chat
   */
  messages: (msgs) => {
    if (!Array.isArray(msgs) || msgs.length === 0) {
      throw new Error("Messages must be a non-empty array");
    }
    if (msgs.length > 100) {
      throw new Error("Too many messages in conversation (max 100)");
    }
    return msgs.map(m => ({
      role: ["user", "assistant"].includes(m.role) ? m.role : "user",
      content: validators.message(m.content)
    }));
  },

  /**
   * Validate notification message (max 200 chars enforced)
   */
  notificationMessage: (text) => {
    if (!text || typeof text !== "string") {
      throw new Error("Notification message must be a non-empty string");
    }
    const truncated = text.substring(0, 200);
    return truncated;
  },

  /**
   * Validate booking request
   */
  bookingRequest: (req) => {
    const { student_id, alumni_id, availability_id, query } = req;
    
    return {
      student_id: validators.studentId(student_id),
      alumni_id: alumni_id ? validators.alumniId(alumni_id) : null,
      availability_id: validators.availabilityId(availability_id),
      query: query ? validators.query(query) : "book a session"
    };
  }
};

/**
 * Sanitize object for LLM context (remove sensitive fields)
 */
export function sanitizeForLLM(obj, fieldsToRemove = []) {
  const defaultSensitiveFields = [
    "password",
    "email",
    "phone",
    "ssn",
    "credit_card",
    "api_key",
    "token"
  ];

  const sensitiveFields = [...defaultSensitiveFields, ...fieldsToRemove];
  const sanitized = { ...obj };

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  return sanitized;
}

/**
 * Validate intent object structure
 */
export function validateIntent(intent) {
  const validIntents = [
    "book_session",
    "find_mentor",
    "resume_review",
    "career_advice",
    "technical_help",
    "mock_interview",
    "general"
  ];

  return {
    intent: validIntents.includes(intent.intent) ? intent.intent : "book_session",
    domain: intent.domain || null,
    urgency: ["high", "medium", "low"].includes(intent.urgency) ? intent.urgency : "medium",
    topics: Array.isArray(intent.topics) ? intent.topics.slice(0, 10) : [],
    preferred_time: intent.preferred_time || null,
    summary: (intent.summary || "").substring(0, 500)
  };
}
