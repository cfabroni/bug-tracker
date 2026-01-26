-- Migration: Add platform-specific status, screenshots, and created_by columns
-- Run this in your Supabase SQL Editor

-- Add created_by field for tracking user-created tasks
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'seed';

-- Add screenshots JSONB column
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS screenshots JSONB DEFAULT '[]'::jsonb;

-- Add platform-specific status columns
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS ios_status TEXT DEFAULT 'untested';
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS android_status TEXT DEFAULT 'untested';

-- Add check constraints (including 'na' for platform-specific tests like "Apple Sign-In iOS only")
ALTER TABLE test_cases ADD CONSTRAINT ios_status_check
  CHECK (ios_status IN ('untested', 'pass', 'fail', 'blocked', 'na'));
ALTER TABLE test_cases ADD CONSTRAINT android_status_check
  CHECK (android_status IN ('untested', 'pass', 'fail', 'blocked', 'na'));

-- Migrate existing status to both platforms
UPDATE test_cases SET ios_status = status, android_status = status
WHERE status != 'untested';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_cases_ios_status ON test_cases(ios_status);
CREATE INDEX IF NOT EXISTS idx_test_cases_android_status ON test_cases(android_status);
CREATE INDEX IF NOT EXISTS idx_test_cases_screenshots ON test_cases USING GIN (screenshots);

-- IMPORTANT: Also create a storage bucket named 'test-screenshots' in Supabase Dashboard
-- Settings: Public bucket, allowed MIME types: image/*, max file size: 5MB
