-- V46: Reset all operation affinity rating downgrades to 0
UPDATE operation_affinities SET rating_downgrade = 0;
