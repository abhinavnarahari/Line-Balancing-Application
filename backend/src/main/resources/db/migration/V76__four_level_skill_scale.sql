-- V76: skill ratings move from 1-5 to the factory's 4-level scale (quarters of the skill circle):
--   1 = in training (20-25%), 2 = needs supervisor help (40-50%),
--   3 = independent, achieves target (60-70%), 4 = expert, achieves target and trains others (>70%).
-- Existing 1-5 values are mapped 5->4 and 4->3 (1, 2 and 3 keep their number), so no row is lost.

ALTER TABLE skill_assessments DROP CONSTRAINT IF EXISTS skill_assessments_rating_check;
ALTER TABLE bulletin_lines   DROP CONSTRAINT IF EXISTS bulletin_lines_skill_rating_required_check;

UPDATE skill_assessments  SET rating = CASE rating WHEN 5 THEN 4 WHEN 4 THEN 3 ELSE rating END WHERE rating >= 4;
UPDATE bulletin_lines     SET skill_rating_required = CASE skill_rating_required WHEN 5 THEN 4 WHEN 4 THEN 3 ELSE skill_rating_required END
 WHERE skill_rating_required >= 4;
UPDATE skill_matrix_history SET old_rating = CASE old_rating WHEN 5 THEN 4 WHEN 4 THEN 3 ELSE old_rating END WHERE old_rating >= 4;
UPDATE skill_matrix_history SET new_rating = CASE new_rating WHEN 5 THEN 4 WHEN 4 THEN 3 ELSE new_rating END WHERE new_rating >= 4;
UPDATE operator_allocation_assignments SET required_skill_level = CASE required_skill_level WHEN 5 THEN 4 WHEN 4 THEN 3 ELSE required_skill_level END WHERE required_skill_level >= 4;
UPDATE operator_allocation_assignments SET assigned_skill_level = CASE assigned_skill_level WHEN 5 THEN 4 WHEN 4 THEN 3 ELSE assigned_skill_level END WHERE assigned_skill_level >= 4;
UPDATE operator_allocation_bottlenecks SET required_skill_level = CASE required_skill_level WHEN 5 THEN 4 WHEN 4 THEN 3 ELSE required_skill_level END WHERE required_skill_level >= 4;
UPDATE operator_station_placements SET required_skill_level = CASE required_skill_level WHEN 5 THEN 4 WHEN 4 THEN 3 ELSE required_skill_level END WHERE required_skill_level >= 4;
UPDATE operator_station_placements SET actual_skill_level = CASE actual_skill_level WHEN 5 THEN 4 WHEN 4 THEN 3 ELSE actual_skill_level END WHERE actual_skill_level >= 4;

ALTER TABLE skill_assessments ADD CONSTRAINT skill_assessments_rating_check CHECK (rating BETWEEN 1 AND 4);
ALTER TABLE bulletin_lines   ADD CONSTRAINT bulletin_lines_skill_rating_required_check
    CHECK (skill_rating_required IS NULL OR skill_rating_required BETWEEN 1 AND 4);
