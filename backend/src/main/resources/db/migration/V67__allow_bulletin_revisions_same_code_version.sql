-- V67: Bulletin revisions share bulletin_code + version with their parent and differ by revision_number.
-- The original UNIQUE (bulletin_code, version) made POST /api/bulletins/{id}/revisions always fail.
-- Existing rows are unique on (code, version), so they are also unique on (code, version, revision_number).

UPDATE operation_bulletins SET revision_number = 1 WHERE revision_number IS NULL;
ALTER TABLE operation_bulletins ALTER COLUMN revision_number SET NOT NULL;

ALTER TABLE operation_bulletins DROP CONSTRAINT IF EXISTS uq_bulletins_code_version;
ALTER TABLE operation_bulletins
    ADD CONSTRAINT uq_bulletins_code_version_revision UNIQUE (bulletin_code, version, revision_number);
