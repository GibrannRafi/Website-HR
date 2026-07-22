-- ============================================================
--  db_skripsi — Portal HR Database Schema
--  Run in TiDB Cloud, Aiven, or MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_skripsi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_skripsi;

-- ============================================================
-- USERS — HR staff accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  company VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- JOBDESKS — Job openings with email subject keywords
-- ============================================================
CREATE TABLE IF NOT EXISTS jobdesks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  subject_keyword VARCHAR(100) NOT NULL,
  email_subject VARCHAR(250) NOT NULL,
  department VARCHAR(100) NOT NULL,
  experience_level ENUM('Junior', 'Mid-level', 'Senior', 'Lead') DEFAULT 'Mid-level',
  description TEXT,
  status ENUM('active', 'on hold', 'closed') DEFAULT 'active',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_job (created_by)
) ENGINE=InnoDB;

-- ============================================================
-- APPLICANTS — CV submissions received via email
-- ============================================================
CREATE TABLE IF NOT EXISTS applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jobdesk_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  location VARCHAR(100),
  cv_filename VARCHAR(255),
  cv_path VARCHAR(500),
  cv_text LONGTEXT,                               -- Extracted plain text from CV (PDF/DOCX)
  match_score DECIMAL(5,2) DEFAULT 0.00,         -- AI score 0-100%
  screening_status ENUM(
    'Screening',
    'Shortlisted',
    'Technical Test',
    'Final Interview',
    'Hired',
    'Rejected',
    'Review Needed',
    'Lolos',
    'Rekomendasi',
    'Kurang Cocok',
    'Tidak Cocok'
  ) DEFAULT 'Screening',
  email_status ENUM('Pending', 'Integrated') DEFAULT 'Integrated',
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  requirement_analysis JSON,                     -- SBERT matched & missing keywords analysis
  insight_summary JSON,                          -- AI summary counts (total, matched, missing)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (jobdesk_id) REFERENCES jobdesks(id) ON DELETE CASCADE,
  INDEX idx_jobdesk_score (jobdesk_id, match_score DESC),
  INDEX idx_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- EMAIL_LOGS — Track outgoing emails to applicants
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicant_id INT NOT NULL,
  jobdesk_id INT NOT NULL,
  subject VARCHAR(300) NOT NULL,
  body TEXT,
  status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
  FOREIGN KEY (jobdesk_id) REFERENCES jobdesks(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- EMAIL_INBOX_LOGS — Track incoming emails processed
-- ============================================================
CREATE TABLE IF NOT EXISTS email_inbox_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(300) UNIQUE,
  from_email VARCHAR(150),
  subject VARCHAR(300),
  matched_jobdesk_id INT,
  processed TINYINT(1) DEFAULT 0,
  applicant_created_id INT,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (matched_jobdesk_id) REFERENCES jobdesks(id) ON DELETE SET NULL,
  FOREIGN KEY (applicant_created_id) REFERENCES applicants(id) ON DELETE SET NULL
) ENGINE=InnoDB;
