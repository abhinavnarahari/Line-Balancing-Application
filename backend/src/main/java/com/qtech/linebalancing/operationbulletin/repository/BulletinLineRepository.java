package com.qtech.linebalancing.operationbulletin.repository;

import com.qtech.linebalancing.operationbulletin.entity.BulletinLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BulletinLineRepository extends JpaRepository<BulletinLine, Long> {
    List<BulletinLine> findByBulletinIdOrderBySequenceAsc(Long bulletinId);
}
