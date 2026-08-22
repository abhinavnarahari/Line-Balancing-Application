CREATE TABLE operator_performance_logs (
    id                          BIGSERIAL       PRIMARY KEY,
    operator_id                 BIGINT          NOT NULL REFERENCES operators(id),
    operation_id                BIGINT          NOT NULL REFERENCES operations(id),
    log_date                    DATE            NOT NULL,
    actual_cycle_time_seconds   INTEGER         NOT NULL,
    recorded_by                 VARCHAR(100),
    notes                       TEXT,
    created_at                  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_perf_logs_operator ON operator_performance_logs(operator_id);
CREATE INDEX idx_perf_logs_operation ON operator_performance_logs(operation_id);
CREATE INDEX idx_perf_logs_date ON operator_performance_logs(log_date);
