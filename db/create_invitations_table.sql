-- SQL to create invitations table
-- Place this file at: db/create_invitations_table.sql

CREATE TABLE IF NOT EXISTS invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  sender_id INT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  status ENUM('pending','accepted','revoked') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME NULL,
  INDEX (email),
  INDEX (sender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
