import jwt from "jsonwebtoken";

/**
 * Auth Middleware
 * Validates JWT tokens and ensures user identity matches requested resource
 */

export const verifyAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default-secret-change-me");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Student Authorization - Ensures user can only access their own data
 */
export const authorizeStudent = (req, res, next) => {
  const requestedStudentId = req.body.student_id || req.params.student_id;
  
  if (!req.user || req.user.id !== requestedStudentId) {
    return res.status(403).json({ 
      error: "Unauthorized - you can only access your own data" 
    });
  }
  next();
};

/**
 * Alumni Authorization - Ensures alumni can only access their own bookings
 */
export const authorizeAlumni = (req, res, next) => {
  const requestedAlumniId = req.body.alumni_id || req.params.alumni_id;
  
  if (!req.user || req.user.id !== requestedAlumniId) {
    return res.status(403).json({ 
      error: "Unauthorized - you can only access your own data" 
    });
  }
  next();
};
