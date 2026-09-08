-- V37: Create notifications table for real-time manager alerts
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGSERIAL       PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    message         TEXT            NOT NULL,
    type            VARCHAR(50)     NOT NULL, -- 'ATTENDANCE_LATE', 'BOTTLENECK_ALERT', 'LINE_PACING', 'SYSTEM'
    severity        VARCHAR(20)     NOT NULL DEFAULT 'WARNING', -- 'INFO', 'WARNING', 'CRITICAL'
    recipient_role  VARCHAR(50)     DEFAULT 'MANAGER',
    operator_id     BIGINT          REFERENCES operators(id) ON DELETE SET NULL,
    shift_id        BIGINT          REFERENCES shifts(id) ON DELETE SET NULL,
    reference_id    BIGINT,
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notif_is_read ON notifications(is_read);
CREATE INDEX idx_notif_type ON notifications(type);
CREATE INDEX idx_notif_operator_id ON notifications(operator_id);
