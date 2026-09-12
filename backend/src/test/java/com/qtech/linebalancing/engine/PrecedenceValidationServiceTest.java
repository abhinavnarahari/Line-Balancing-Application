package com.qtech.linebalancing.engine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PrecedenceValidationServiceTest {

    private PrecedenceValidationService service;

    @BeforeEach
    void setUp() {
        service = new PrecedenceValidationService();
    }

    @Test
    @DisplayName("Should successfully validate acyclic valid precedence sequence")
    void testValidPrecedenceSequence() {
        // Op 1 -> Op 2 -> Op 3
        var op1 = PrecedenceValidationService.OperationNode.builder()
                .operationId(1L).operationCode("OP-01").operationName("Front Pocket").sequence(1).build();
        var op2 = PrecedenceValidationService.OperationNode.builder()
                .operationId(2L).operationCode("OP-02").operationName("Fly Attach").sequence(2).predecessorIds(List.of(1L)).build();
        var op3 = PrecedenceValidationService.OperationNode.builder()
                .operationId(3L).operationCode("OP-03").operationName("Side Seam").sequence(3).predecessorIds(List.of(2L)).build();

        var result = service.validate(List.of(op1, op2, op3));

        assertTrue(result.isValid());
        assertFalse(result.isHasCycle());
        assertEquals(List.of(1L, 2L, 3L), result.getTopologicallySortedOperationIds());
    }

    @Test
    @DisplayName("Should detect circular dependency cycle (A -> B -> A) and provide exact path")
    void testCircularDependencyDetection() {
        // Op 1 depends on Op 2, and Op 2 depends on Op 1
        var op1 = PrecedenceValidationService.OperationNode.builder()
                .operationId(10L).operationCode("OP-10").operationName("Waistband Attach").sequence(1).predecessorIds(List.of(20L)).build();
        var op2 = PrecedenceValidationService.OperationNode.builder()
                .operationId(20L).operationCode("OP-20").operationName("Belt Loop Attach").sequence(2).predecessorIds(List.of(10L)).build();

        var result = service.validate(List.of(op1, op2));

        assertFalse(result.isValid());
        assertTrue(result.isHasCycle());
        assertNotNull(result.getErrorMessage());
        assertTrue(result.getErrorMessage().contains("Circular dependency"));
        assertNotNull(result.getCyclePath());
        assertTrue(result.getCyclePath().size() >= 2);
    }
}
