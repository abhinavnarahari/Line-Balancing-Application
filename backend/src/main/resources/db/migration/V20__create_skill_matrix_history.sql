CREATE TABLE skill_matrix_history (
    id              BIGSERIAL       PRIMARY KEY,
    operator_id     BIGINT          NOT NULL REFERENCES operators(id),
    operation_id    BIGINT          NOT NULL REFERENCES operations(id),
    old_rating      INTEGER         NOT NULL,
    new_rating      INTEGER         NOT NULL,
    updated_by      VARCHAR(255)    NOT NULL,
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skill_history_operator ON skill_matrix_history(operator_id);
CREATE INDEX idx_skill_history_operation ON skill_matrix_history(operation_id);
CREATE INDEX idx_skill_history_date ON skill_matrix_history(updated_at);
