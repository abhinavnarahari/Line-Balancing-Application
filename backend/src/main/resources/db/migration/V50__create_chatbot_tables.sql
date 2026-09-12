-- V50: Create chatbot tables for grounded enterprise manufacturing assistant
-- Stores conversation sessions, individual message histories, and user feedback

CREATE TABLE IF NOT EXISTS chat_conversations (
    id                  BIGSERIAL       PRIMARY KEY,
    user_identifier     VARCHAR(100)    NOT NULL DEFAULT 'default_user',
    title               VARCHAR(255)    NOT NULL,
    context_metadata    TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_identifier);
CREATE INDEX IF NOT EXISTS idx_chat_conv_updated ON chat_conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
    id                  BIGSERIAL       PRIMARY KEY,
    conversation_id     BIGINT          NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender              VARCHAR(20)     NOT NULL CHECK (sender IN ('USER', 'ASSISTANT', 'SYSTEM')),
    message_text        TEXT            NOT NULL,
    intent              VARCHAR(100),
    data_source         VARCHAR(50)     DEFAULT 'APPLICATION_DATA',
    data_available      BOOLEAN         DEFAULT TRUE,
    structured_payload  TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_created ON chat_messages(created_at ASC);

CREATE TABLE IF NOT EXISTS chat_feedback (
    id                  BIGSERIAL       PRIMARY KEY,
    message_id          BIGINT          NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    is_helpful          BOOLEAN         NOT NULL,
    comment             TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_feedback_msg ON chat_feedback(message_id);
