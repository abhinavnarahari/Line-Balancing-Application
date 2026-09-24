package com.qtech.linebalancing.allocation.service;

import com.qtech.linebalancing.allocation.dto.LineRequirementDTO;
import com.qtech.linebalancing.allocation.dto.OperatorPoolDTO;
import com.qtech.linebalancing.allocation.dto.OptimizationRequestDTO;
import com.qtech.linebalancing.allocation.dto.PreflightValidationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AllocationConstraintValidator {

    public PreflightValidationDTO validate(
            OptimizationRequestDTO request,
            List<LineRequirementDTO> lineRequirements,
            List<OperatorPoolDTO> operatorPool) {

        List<PreflightValidationDTO.ValidationIssueItem> issues = new ArrayList<>();

        if (lineRequirements == null || lineRequirements.isEmpty()) {
            issues.add(PreflightValidationDTO.ValidationIssueItem.builder()
                    .severity("ERROR")
                    .issueType("MISSING_LINES")
                    .lineName("Global")
                    .problemDescription("No sewing lines selected for optimization.")
                    .recommendedAction("Select at least one sewing line in the Planning Context.")
                    .build());
            return PreflightValidationDTO.builder()
                    .isValid(false)
                    .totalErrors(1)
                    .totalWarnings(0)
                    .totalInfo(0)
                    .summaryMessage("Validation failed: No lines selected.")
                    .issues(issues)
                    .build();
        }

        int totalRequiredOperators = lineRequirements.stream().mapToInt(LineRequirementDTO::getDesignedManpower).sum();
        long presentOperatorsCount = operatorPool.stream().filter(op -> "PRESENT".equalsIgnoreCase(op.getAttendanceStatus()) || "AVAILABLE".equalsIgnoreCase(op.getAvailabilityStatus())).count();

        // 1. Manpower Shortage Check
        if (presentOperatorsCount < totalRequiredOperators) {
            issues.add(PreflightValidationDTO.ValidationIssueItem.builder()
                    .severity("WARNING")
                    .issueType("ATTENDANCE_SHORTAGE")
                    .lineName("Factory Floor Pool")
                    .problemDescription("Total present operators (" + presentOperatorsCount + ") is less than planned manpower (" + totalRequiredOperators + ").")
                    .recommendedAction("Optimizer will maximize high-priority lines and highlight operator shortages.")
                    .build());
        }

        // 2. Fixed Operator Assignment Validations
        if (request.getFixedAssignments() != null && !request.getFixedAssignments().isEmpty()) {
            Set<Long> pinnedOperators = new HashSet<>();
            for (var fix : request.getFixedAssignments()) {
                if (fix.getOperatorId() == null) continue;
                if (!pinnedOperators.add(fix.getOperatorId())) {
                    issues.add(PreflightValidationDTO.ValidationIssueItem.builder()
                            .severity("ERROR")
                            .issueType("FIXED_ASSIGNMENT_CONFLICT")
                            .lineName("Line ID " + fix.getLineId())
                            .stationCode("S" + fix.getStationIndex())
                            .problemDescription("Operator ID " + fix.getOperatorId() + " is pinned to multiple workstations simultaneously.")
                            .recommendedAction("Remove duplicate fixed assignment constraint.")
                            .build());
                }

                OperatorPoolDTO opDto = operatorPool.stream()
                        .filter(o -> o.getOperatorId().equals(fix.getOperatorId()))
                        .findFirst().orElse(null);

                if (opDto != null && ("ABSENT".equalsIgnoreCase(opDto.getAttendanceStatus()) || "ON_LEAVE".equalsIgnoreCase(opDto.getAttendanceStatus()))) {
                    issues.add(PreflightValidationDTO.ValidationIssueItem.builder()
                            .severity("WARNING")
                            .issueType("FIXED_OPERATOR_ABSENT")
                            .lineName("Line ID " + fix.getLineId())
                            .stationCode("S" + fix.getStationIndex())
                            .problemDescription("Pinned operator " + opDto.getOperatorName() + " is marked as " + opDto.getAttendanceStatus() + ".")
                            .recommendedAction("Verify attendance or replace pinned operator.")
                            .build());
                }
            }
        }

        // 3. Line-Specific Validations (SMV, Machine availability, Skill Gaps)
        for (LineRequirementDTO line : lineRequirements) {
            if (line.getTotalSmvMinutes() == null || line.getTotalSmvMinutes() <= 0.0) {
                issues.add(PreflightValidationDTO.ValidationIssueItem.builder()
                        .severity("ERROR")
                        .issueType("ZERO_SMV")
                        .lineId(line.getLineId())
                        .lineName(line.getLineName())
                        .problemDescription("Operation Bulletin for " + line.getStyleNo() + " has zero total SMV.")
                        .recommendedAction("Verify and approve standard SMV in Operation Bulletin master.")
                        .build());
            }

            if (line.getStations() != null) {
                for (var st : line.getStations()) {
                    if (st.getOperationSmv() == null || st.getOperationSmv() <= 0.0) {
                        issues.add(PreflightValidationDTO.ValidationIssueItem.builder()
                                .severity("WARNING")
                                .issueType("ZERO_STATION_SMV")
                                .lineId(line.getLineId())
                                .lineName(line.getLineName())
                                .stationCode(st.getStationCode())
                                .operationName(st.getOperationName())
                                .problemDescription("Station operation has undefined or zero SMV.")
                                .recommendedAction("Set valid standard SMV.")
                                .build());
                    }

                    // Check if there is at least one operator capable of running this machine
                    if (st.getRequiredMachineType() != null && !"Manual".equalsIgnoreCase(st.getRequiredMachineType())) {
                        boolean hasMachineOperator = operatorPool.stream()
                                .anyMatch(op -> op.getQualifiedMachines() != null && op.getQualifiedMachines().stream()
                                        .anyMatch(m -> m.getMachineType().equalsIgnoreCase(st.getRequiredMachineType())));

                        if (!hasMachineOperator) {
                            issues.add(PreflightValidationDTO.ValidationIssueItem.builder()
                                    .severity("WARNING")
                                    .issueType("MACHINE_GAP")
                                    .lineId(line.getLineId())
                                    .lineName(line.getLineName())
                                    .stationCode(st.getStationCode())
                                    .operationName(st.getOperationName())
                                    .problemDescription("No operator in pool holds formal certification for '" + st.getRequiredMachineType() + "'.")
                                    .recommendedAction("Train/certify operators or permit cross-trained operators.")
                                    .build());
                        }
                    }
                }
            }
        }

        int totalErrors = (int) issues.stream().filter(i -> "ERROR".equalsIgnoreCase(i.getSeverity())).count();
        int totalWarnings = (int) issues.stream().filter(i -> "WARNING".equalsIgnoreCase(i.getSeverity())).count();
        int totalInfo = (int) issues.stream().filter(i -> "INFO".equalsIgnoreCase(i.getSeverity())).count();

        boolean isValid = totalErrors == 0;
        String summary = isValid
                ? "Planning data pre-flight check passed with " + totalWarnings + " warning(s). Ready for multi-line constraint optimization."
                : "Validation failed with " + totalErrors + " critical error(s). Please review before solving.";

        return PreflightValidationDTO.builder()
                .isValid(isValid)
                .totalErrors(totalErrors)
                .totalWarnings(totalWarnings)
                .totalInfo(totalInfo)
                .summaryMessage(summary)
                .issues(issues)
                .build();
    }
}
