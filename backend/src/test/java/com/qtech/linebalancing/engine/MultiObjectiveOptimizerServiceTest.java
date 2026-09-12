package com.qtech.linebalancing.engine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MultiObjectiveOptimizerServiceTest {

    private MultiObjectiveOptimizerService optimizer;

    @BeforeEach
    void setUp() {
        var balanceCalc = new LineBalanceCalculationService();
        var precCalc = new PrecedenceValidationService();
        optimizer = new MultiObjectiveOptimizerService(balanceCalc, precCalc);
    }

    @Test
    @DisplayName("Should propose parallel operator recommendation for heavy operations")
    void testParallelOperatorProposal() {
        // Operation with 1.2 min (72s) on a 41.14s Designed Pitch
        var heavyOp = MultiObjectiveOptimizerService.CandidateOperation.builder()
                .operationId(100L)
                .operationCode("OP-100")
                .operationName("Heavy Inseam Felling")
                .machineType("Feed-off-arm")
                .standardSmvMinutes(1.20)
                .sequence(1)
                .isParallelizable(true)
                .splitAllowed(false)
                .build();

        var req = MultiObjectiveOptimizerService.OptimizationRequest.builder()
                .operations(List.of(heavyOp))
                .designedPitchSecs(41.14)
                .requiredDesignCapacity(87.5)
                .customerTaktSecs(51.43)
                .build();

        var result = optimizer.optimize(req);

        assertNotNull(result);
        assertEquals(1, result.getProposedStations().size());
        assertEquals(2, result.getProposedStations().get(0).getAllocatedOperators()); // 72s / 2 = 36s (< 41.14s)
        
        assertFalse(result.getRecommendations().isEmpty());
        assertEquals("PARALLEL_OP", result.getRecommendations().get(0).getStrategyType());
        assertTrue(result.getRecommendations().get(0).getReason().contains("Parallelization"));
    }
}
