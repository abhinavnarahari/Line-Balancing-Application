-- V74: SewNexa AI remembers what each answer was about (intent + resolved record ids) so follow-up
-- questions ("and LINE-02?", "what is its SMV?") can be understood. Stored per assistant message.
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS assistant_state TEXT;
