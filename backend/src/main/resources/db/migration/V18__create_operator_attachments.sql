CREATE TABLE operator_attachments (
    id BIGSERIAL PRIMARY KEY,
    operator_id BIGINT NOT NULL REFERENCES operators(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(255) NOT NULL,
    data BYTEA NOT NULL,
    uploaded_at TIMESTAMP NOT NULL
);
