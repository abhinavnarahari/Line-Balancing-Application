-- V73: Optimistic locking for documents edited by several people (operation bulletins, orders).
-- Named row_version because operation_bulletins already has a business "version" column.
ALTER TABLE operation_bulletins ADD COLUMN IF NOT EXISTS row_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE orders              ADD COLUMN IF NOT EXISTS row_version BIGINT NOT NULL DEFAULT 0;
