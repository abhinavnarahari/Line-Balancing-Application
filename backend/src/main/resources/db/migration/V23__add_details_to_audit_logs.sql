-- V23: Add details column to audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details VARCHAR(500);
