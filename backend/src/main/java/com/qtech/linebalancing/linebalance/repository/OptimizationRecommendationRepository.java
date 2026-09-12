package com.qtech.linebalancing.linebalance.repository;

import com.qtech.linebalancing.linebalance.entity.OptimizationRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OptimizationRecommendationRepository extends JpaRepository<OptimizationRecommendation, Long> {
    List<OptimizationRecommendation> findByLineDesignId(Long lineDesignId);
}
