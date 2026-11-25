package com.qtech.linebalancing.allocation;

import com.qtech.linebalancing.allocation.service.OperatorPerformanceService;
import com.qtech.linebalancing.allocation.service.OperatorPerformanceService.OperatorPerformanceEvaluation;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.repository.OperationRepository;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assumptions.assumeThat;

/**
 * PERF-01: the bulk-loaded snapshot must give exactly the same evaluation as the per-pair queries,
 * for every operator x operation in the local dataset. Requires the local PostgreSQL.
 */
@SpringBootTest
@Transactional
class PerformanceSnapshotEquivalenceTest {

    @Autowired private OperatorPerformanceService service;
    @Autowired private OperatorRepository operatorRepository;
    @Autowired private OperationRepository operationRepository;

    @Test
    void snapshotMatchesPerQueryEvaluationForAllPairs() {
        List<Operator> operators = operatorRepository.findAll();
        List<Operation> operations = operationRepository.findAll();
        assumeThat(operators).isNotEmpty();
        assumeThat(operations).isNotEmpty();

        long t0 = System.nanoTime();
        var snapshot = service.loadSnapshot(operators.stream().map(Operator::getId).toList(),
                operations.stream().map(Operation::getId).toList());
        int pairs = 0;
        long snapshotNanos = 0;
        long queryNanos = 0;
        for (Operator op : operators) {
            for (Operation opn : operations) {
                String machine = opn.getMachineType();
                double smv = opn.getStandardSmv() != null ? opn.getStandardSmv().doubleValue() : 0.5;
                long a = System.nanoTime();
                OperatorPerformanceEvaluation fast = service.evaluate(snapshot, op.getId(), opn.getId(), machine, smv, 3);
                long b = System.nanoTime();
                OperatorPerformanceEvaluation slow = service.evaluate(op.getId(), opn.getId(), machine, smv, 3);
                long c = System.nanoTime();
                snapshotNanos += b - a;
                queryNanos += c - b;
                assertThat(fast).as("operator %s / operation %s", op.getId(), opn.getId()).isEqualTo(slow);
                pairs++;
            }
        }
        System.out.printf("PERF-01: %d pairs identical. snapshot load+eval %.0f ms vs per-pair queries %.0f ms%n",
                pairs, (snapshotNanos + (System.nanoTime() - t0 - snapshotNanos - queryNanos)) / 1e6, queryNanos / 1e6);
    }
}
