CREATE DATABASE IF NOT EXISTS reconnect;
USE reconnect;

/* ---------- USERS ---------- */
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  role ENUM('student','alumni')
);

/* ---------- STUDENT PROFILE ---------- */
CREATE TABLE IF NOT EXISTS student_profile (
  student_id INT PRIMARY KEY,
  skills TEXT NOT NULL,
  interests TEXT NOT NULL,
  linkedin_url VARCHAR(255),
  coding_url VARCHAR(255),
  resume_url VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);


/* ---------- ALUMNI PROFILE ---------- */
CREATE TABLE IF NOT EXISTS alumni_profile (
  alumni_id INT PRIMARY KEY,
  domain VARCHAR(100) NOT NULL,
  company VARCHAR(100) NOT NULL,
  expertise TEXT NOT NULL,
  linkedin_url VARCHAR(255),
  coding_url VARCHAR(255),
  resume_url VARCHAR(255),
  FOREIGN KEY (alumni_id) REFERENCES users(user_id)
);


/* ---------- AVAILABILITY ---------- */
CREATE TABLE availability (
  availability_id INT AUTO_INCREMENT PRIMARY KEY,
  alumni_id INT,
  date DATE,
  start_time TIME,
  end_time TIME,
  is_booked BOOLEAN DEFAULT false,
  FOREIGN KEY (alumni_id) REFERENCES users(user_id)
);

/* ---------- BOOKINGS ---------- */
CREATE TABLE bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  alumni_id INT,
  availability_id INT,
  status ENUM('pending','approved','rejected','completed'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (alumni_id) REFERENCES users(user_id),
  FOREIGN KEY (availability_id) REFERENCES availability(availability_id)
);

/* ---------- NOTIFICATIONS ---------- */
CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

/* ---------- METRICS (FOR COMPARISON) ---------- */
CREATE TABLE metrics (
  metric_id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50),
  value FLOAT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ─── SCHEMA UPDATES FOR AGENTIC AI ─── */

-- Add date/time/meet_link columns to bookings (if not exists)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS date DATE,
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS meet_link VARCHAR(255),
  ADD COLUMN IF NOT EXISTS intent VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ai_policy VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ai_match_score INT,
  ADD COLUMN IF NOT EXISTS ai_match_reason TEXT;

-- Add designation field to alumni_profile (used in legacy agent)
ALTER TABLE alumni_profile
  ADD COLUMN IF NOT EXISTS designation VARCHAR(100);

-- Add department to student_profile (used in legacy matching)
ALTER TABLE student_profile
  ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Agent activity log
CREATE TABLE IF NOT EXISTS agent_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  agent_name VARCHAR(50),
  student_id INT,
  input_summary TEXT,
  output_summary TEXT,
  latency_ms INT,
  success BOOLEAN DEFAULT true,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
