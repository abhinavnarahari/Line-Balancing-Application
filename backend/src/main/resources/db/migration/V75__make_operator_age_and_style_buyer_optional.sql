-- V75: operator age and style buyer become optional (factories don't always record them).
-- Only relaxes NOT NULL; existing values are untouched. The operators age range CHECK still applies when an age is given.
ALTER TABLE operators ALTER COLUMN age DROP NOT NULL;
ALTER TABLE styles ALTER COLUMN buyer DROP NOT NULL;
