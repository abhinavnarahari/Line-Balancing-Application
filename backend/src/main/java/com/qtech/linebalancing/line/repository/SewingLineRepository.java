package com.qtech.linebalancing.line.repository;

import com.qtech.linebalancing.line.entity.SewingLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SewingLineRepository extends JpaRepository<SewingLine, Long> {
    List<SewingLine> findByActive(boolean active);
    Optional<SewingLine> findByLineCode(String lineCode);
    boolean existsByLineCode(String lineCode);
    boolean existsByLineCodeAndIdNot(String lineCode, Long id);
}
