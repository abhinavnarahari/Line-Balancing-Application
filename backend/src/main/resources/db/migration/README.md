# Database migrations — rules

Flyway runs in strict mode (`baseline-on-migrate=false`, `out-of-order=false`, `validate-on-migrate=true`).

1. **Never edit or delete a migration that has been deployed.** Fix forward with a new `V<next>__...sql`.
   Editing an applied file makes the app refuse to start (checksum mismatch).
2. **Always use the next number** after the highest existing version. Lower numbers are not applied late.
3. **No unconditional `DELETE`/`TRUNCATE` of business tables** (orders, bulletins, plans, production,
   attendance, skills). Schema migrations run on production data. Sample/demo data must be inserted
   idempotently (`ON CONFLICT DO NOTHING`, `WHERE NOT EXISTS`) and must not overwrite user data.
4. Data fixes must be **narrowly targeted** (`WHERE status = 'RELEASED'`, not whole-table rewrites) and
   explained in a header comment.
5. If an environment's history drifted before strict mode, start it once with `FLYWAY_REPAIR_ON_START=true`
   (repairs `flyway_schema_history` only), then remove the flag.
