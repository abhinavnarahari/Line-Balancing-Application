-- Removes ALL business data (sample or real) so a factory can start with its own imports.
-- Keeps: user accounts (app_users) and Flyway's migration history, so the schema is untouched and you can log in.
--
-- THIS CANNOT BE UNDONE. Take a backup first, e.g.
--   pg_dump -h <host> -U <user> -d <db> -Fc -f before_clear.dump
-- Run:
--   psql -h <host> -U <user> -d <db> -v ON_ERROR_STOP=1 -f scripts/clear-sample-data.sql
-- Also set DEMO_DATA_DAILY_REFRESH=false, otherwise the daily refresh keeps adding sample attendance/production.

BEGIN;

DO $$
DECLARE
    keep  text[] := ARRAY['app_users', 'flyway_schema_history'];
    users_before bigint;
    users_after  bigint;
    tables text;
BEGIN
    SELECT count(*) INTO users_before FROM app_users;

    SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
      INTO tables
      FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename <> ALL (keep)
       AND tablename NOT LIKE 'flyway_schema_history%';  -- also keep manual copies of the migration history

    IF tables IS NOT NULL THEN
        RAISE NOTICE 'Clearing: %', tables;
        EXECUTE 'TRUNCATE TABLE ' || tables || ' RESTART IDENTITY CASCADE';
    END IF;

    SELECT count(*) INTO users_after FROM app_users;
    IF users_after <> users_before THEN
        RAISE EXCEPTION 'User accounts would be lost (% -> %); nothing was changed', users_before, users_after;
    END IF;
END $$;

COMMIT;
