-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('admin', 'hr') NOT NULL DEFAULT 'hr' AFTER company;

-- Insert default admin (password: Admin@1234)
-- bcrypt hash dari 'Admin@1234' adalah: $2a$10$...
-- Kita akan buat admin via script terpisah
