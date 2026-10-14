-- V66: Rolling daily sample data
-- V65 seeds attendance and piece production logs only for the day the migration ran.
-- Every screen that defaults to "today" (attendance, production, hourly, operator pool)
-- is therefore empty from the next day onwards. This function fills the given date with
-- the same sample day, ONLY when that date has no records yet, so real data is never touched.
-- It is invoked by DemoDataRefresher on startup and daily just after midnight.

CREATE OR REPLACE FUNCTION refresh_daily_demo_data(p_date DATE)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_shift_id BIGINT;
BEGIN
    SELECT id INTO v_shift_id FROM shifts ORDER BY id LIMIT 1;

    -- Attendance: all active operators present
    IF v_shift_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM attendance_records WHERE attendance_date = p_date) THEN
        INSERT INTO attendance_records (
            operator_id, attendance_date, shift_id, status, check_in_time, check_out_time, remarks, created_at, updated_at
        )
        SELECT op.id, p_date, v_shift_id, 'PRESENT', '07:55:00'::TIME, '16:35:00'::TIME,
               'On-time shopfloor biometric check-in', NOW(), NOW()
        FROM operators op
        WHERE op.active = TRUE
        ON CONFLICT (attendance_date, operator_id, shift_id) DO NOTHING;
    END IF;

    -- Piece production logs: 145 pcs flow output on Line 01 (same as V65 section 11)
    IF NOT EXISTS (SELECT 1 FROM piece_production_logs WHERE log_date = p_date) THEN
        INSERT INTO piece_production_logs (
            operator_id, operation_id, operation_name, order_id, target_qty, completed_qty, good_qty, reject_qty,
            start_time, end_time, actual_time_minutes, sam_minutes, machine_code, log_date, hour_slot, created_at
        )
        SELECT op.id, ops.id, t.op_name, o.id, t.t_qty, t.c_qty, t.g_qty, t.r_qty,
               '10:00:00'::TIME, '11:00:00'::TIME, 60, t.sam, t.m_type, p_date, 10, NOW()
        FROM (VALUES
            ('EMP-001', 'OP-001', 'Shoulder Join',          150, 150, 150, 0, 0.45, '4-Thread Overlock'),
            ('EMP-002', 'OP-002', 'Neck Rib Attach',        150, 150, 150, 0, 0.50, '4-Thread Overlock'),
            ('EMP-003', 'OP-003', 'Neck Top Stitch',        148, 148, 148, 0, 0.35, 'Single Needle Lockstitch'),
            ('EMP-004', 'OP-004', 'Sleeve Attach Left',     148, 148, 148, 0, 0.45, '4-Thread Overlock'),
            ('EMP-005', 'OP-005', 'Sleeve Attach Right',    148, 148, 148, 0, 0.45, '4-Thread Overlock'),
            ('EMP-006', 'OP-006', 'Side Seam Close',        148, 148, 148, 0, 0.55, '4-Thread Overlock'),
            ('EMP-007', 'OP-008', 'Sleeve Hem',             145, 145, 145, 0, 0.45, 'Flatlock / Interlock'),
            ('EMP-008', 'OP-007', 'Bottom Hem',             145, 145, 145, 0, 0.50, 'Flatlock / Interlock')
        ) AS t(emp_code, op_code, op_name, t_qty, c_qty, g_qty, r_qty, sam, m_type)
        JOIN operators op ON op.employee_id = t.emp_code
        JOIN operations ops ON ops.operation_code = t.op_code
        JOIN orders o ON o.order_no = 'PO-2026-001';
    END IF;
END;
$$;
