-- V68: line_plans.status uses the vocabulary draft / active / completed (LinePlanService, frontend types).
-- V65 seeded the LINE-02 plan as 'RELEASED', so dashboards never treated it as the active plan.
UPDATE line_plans SET status = 'active' WHERE status = 'RELEASED';
