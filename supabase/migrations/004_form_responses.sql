-- Add JSONB column for Google Form responses to candidate profiles
ALTER TABLE profiles ADD COLUMN form_responses JSONB DEFAULT NULL;
