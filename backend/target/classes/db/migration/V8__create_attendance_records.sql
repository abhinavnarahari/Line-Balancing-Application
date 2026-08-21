-- V8: Create attendance_records table
-- Daily operator attendance tracking.
-- One record per operator per shift per date (enforced by unique constraint).
-- Upsert pattern: re-marking attendance updates the existing record.

CREATE TABLE IF NOT EXISTS attendance_records (
    id              BIGSERIAL       PRIMARY KEY,
    attendance_date DATE            NOT NULL,
    operator_id     BIGINT          NOT NULL,
    shift_id        BIGINT          NOT NULL,
    status          VARCHAR(20)     NOT NULL CHECK (status IN
                        ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'NOT_REPORTED')),
    check_in_time   TIME,
    check_out_time  TIME,
    remarks         TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_att_operator  FOREIGN KEY (operator_id) REFERENCES operators(id),
    CONSTRAINT fk_att_shift     FOREIGN KEY (shift_id)    REFERENCES shifts(id),
    CONSTRAINT uq_att_unique    UNIQUE (attendance_date, operator_id, shift_id)
);

CREATE INDEX idx_att_date       ON attendance_records(attendance_date);
CREATE INDEX idx_att_operator   ON attendance_records(operator_id);
CREATE INDEX idx_att_shift      ON attendance_records(shift_id);
CREATE INDEX idx_att_status     ON attendance_records(status);

COMMENT ON TABLE attendance_records IS 'Daily attendance tracking. One record per operator per shift per date.';
COMMENT ON COLUMN attendance_records.status IS 'PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE, NOT_REPORTED.';
