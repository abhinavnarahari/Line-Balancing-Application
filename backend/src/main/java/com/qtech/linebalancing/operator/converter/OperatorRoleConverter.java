package com.qtech.linebalancing.operator.converter;

import com.qtech.linebalancing.operator.entity.Operator.OperatorRole;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class OperatorRoleConverter implements AttributeConverter<OperatorRole, String> {

    @Override
    public String convertToDatabaseColumn(OperatorRole role) {
        return role != null ? role.name() : OperatorRole.OPERATOR.name();
    }

    @Override
    public OperatorRole convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return OperatorRole.OPERATOR;
        }
        String normalized = dbData.trim().toUpperCase().replace(" ", "_");
        return switch (normalized) {
            case "OPERATOR", "SEWING_OPERATOR", "SENIOR_OPERATOR", "JUNIOR_OPERATOR" -> OperatorRole.OPERATOR;
            case "HELPER", "FLOOR_HELPER" -> OperatorRole.HELPER;
            case "FLOATER", "RELIEVER" -> OperatorRole.FLOATER;
            case "LINE_SUPERVISOR", "SUPERVISOR", "MASTER_TAILOR" -> OperatorRole.LINE_SUPERVISOR;
            case "QUALITY_CHECKER", "QC", "SECTION_QC", "QC_INSPECTOR" -> OperatorRole.QUALITY_CHECKER;
            default -> OperatorRole.OPERATOR;
        };
    }
}
