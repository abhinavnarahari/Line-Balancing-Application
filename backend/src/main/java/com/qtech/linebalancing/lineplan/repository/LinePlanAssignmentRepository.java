package com.qtech.linebalancing.lineplan.repository;

import com.qtech.linebalancing.lineplan.entity.LinePlanAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LinePlanAssignmentRepository extends JpaRepository<LinePlanAssignment, Long> {
}
