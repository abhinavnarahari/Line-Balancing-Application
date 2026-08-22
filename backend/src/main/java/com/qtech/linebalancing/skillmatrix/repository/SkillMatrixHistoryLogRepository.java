package com.qtech.linebalancing.skillmatrix.repository;

import com.qtech.linebalancing.skillmatrix.entity.SkillMatrixHistoryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillMatrixHistoryLogRepository extends JpaRepository<SkillMatrixHistoryLog, Long> {
    List<SkillMatrixHistoryLog> findByOperatorId(Long operatorId);
    List<SkillMatrixHistoryLog> findAllByOrderByUpdatedAtDesc();
}
