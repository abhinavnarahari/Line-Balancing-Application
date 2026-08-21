-- V11: Seed shifts
-- Initial 4 shifts as specified in the requirements

INSERT INTO shifts (shift_code, shift_name, start_time, end_time, active) VALUES
('A',       'A Shift',       '07:00', '14:00', TRUE),
('B',       'B Shift',       '14:00', '23:00', TRUE),
('C',       'C Shift',       '23:00', '07:00', TRUE),  -- Overnight shift
('GENERAL', 'General Shift', '09:00', '18:00', TRUE);
