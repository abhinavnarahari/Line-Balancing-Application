package com.qtech.linebalancing.allocation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperatorPoolDTO {

    private Long operatorId;
    private String employeeCode;
    private String operatorName;
    private Integer age;
    private String gender;
    private String department;
    private String role; // OPERATOR, HELPER, FLOATER, QUALITY_CHECKER
    private Long currentLineId;
    private String currentLineName;
    private Double averageSkillRating; // e.g. 4.5 or 3.2
    private List<QualifiedOperationItem> qualifiedOperations;
    private List<QualifiedMachineItem> qualifiedMachines;
    private String shiftAvailability; // FULL_SHIFT, HALF_SHIFT, NOT_AVAILABLE
    private String attendanceStatus; // PRESENT, ABSENT, ON_LEAVE, LATE, NOT_REPORTED
    private Double historicalEfficiency; // e.g. 88.5%
    private Double historicalQualityRate; // e.g. 97.8%
    private String availabilityStatus; // AVAILABLE, ASSIGNED, ABSENT, SKILL_GAP, MACHINE_GAP, NOT_QUALIFIED
    private boolean isAssigned;
    private Long assignedLineId;
    private String assignedLineName;
    private String assignedStationCode;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualifiedOperationItem {
        private Long operationId;
        private String operationCode;
        private String operationName;
        private Integer rating; // 1 to 5
        private Integer cycleTimeSeconds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualifiedMachineItem {
        private String machineType;
        private Integer qualificationLevel;
        private Integer experienceMonths;
        private Boolean isPrimary;
    }
}
