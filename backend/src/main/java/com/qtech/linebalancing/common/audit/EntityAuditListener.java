package com.qtech.linebalancing.common.audit;

import com.qtech.linebalancing.common.BeanUtil;
import jakarta.persistence.*;
import java.lang.reflect.Field;
import java.time.LocalDateTime;

public class EntityAuditListener {

    @PostPersist
    public void postPersist(Object entity) {
        if (!(entity instanceof AuditLog)) {
            logAction(entity, "Created");
        }
    }

    @PostUpdate
    public void postUpdate(Object entity) {
        if (!(entity instanceof AuditLog)) {
            logAction(entity, "Updated");
        }
    }

    @PostRemove
    public void postRemove(Object entity) {
        if (!(entity instanceof AuditLog)) {
            logAction(entity, "Deleted");
        }
    }

    @SuppressWarnings("null")
    private void logAction(Object entity, String action) {
        try {
            AuditLogRepository auditLogRepository = BeanUtil.getBean(AuditLogRepository.class);
            if (auditLogRepository != null) {
                String entityName = entity.getClass().getSimpleName();
                String entityId = extractId(entity);
                String details = buildDetailedExplanation(entity, entityName, entityId, action);
                
                AuditLog log = AuditLog.builder()
                        .entityName(entityName)
                        .entityId(entityId)
                        .action(action)
                        .details(details)
                        .performedBy("Admin")
                        .timestamp(LocalDateTime.now())
                        .build();
                
                auditLogRepository.save(log);
            }
        } catch (Exception e) {
            // Ignore audit log failures
        }
    }

    private String buildDetailedExplanation(Object entity, String entityName, String entityId, String action) {
        String actTitle = action != null && !action.isEmpty() 
            ? Character.toUpperCase(action.charAt(0)) + action.substring(1).toLowerCase() 
            : "Modified";
        try {
            switch (entityName) {
                case "Operator": {
                    String name = getFieldValue(entity, "name");
                    String empId = getFieldValue(entity, "employeeId");
                    String dept = getFieldValue(entity, "department");
                    String code = empId != null && !empId.isEmpty() ? empId : ("#" + entityId);
                    StringBuilder sb = new StringBuilder(actTitle).append(" Operator ").append(code);
                    if (name != null || dept != null) {
                        sb.append(" (");
                        if (name != null) sb.append(name);
                        if (dept != null) sb.append(" · ").append(dept).append(" Dept");
                        sb.append(")");
                    }
                    return sb.toString();
                }
                case "Shift": {
                    String code = getFieldValue(entity, "shiftCode");
                    String name = getFieldValue(entity, "shiftName");
                    String start = getFieldValue(entity, "startTime");
                    String end = getFieldValue(entity, "endTime");
                    StringBuilder sb = new StringBuilder(actTitle).append(" Shift ");
                    sb.append(code != null ? code : ("#" + entityId));
                    if (name != null || (start != null && end != null)) {
                        sb.append(" (");
                        if (name != null) sb.append(name);
                        if (start != null && end != null) sb.append(" · ").append(start).append("–").append(end);
                        sb.append(")");
                    }
                    return sb.toString();
                }
                case "Operation": {
                    String code = getFieldValue(entity, "operationCode");
                    String name = getFieldValue(entity, "name");
                    String machine = getFieldValue(entity, "machineType");
                    StringBuilder sb = new StringBuilder(actTitle).append(" Operation ");
                    sb.append(code != null ? code : ("#" + entityId));
                    if (name != null || machine != null) {
                        sb.append(" (");
                        if (name != null) sb.append(name);
                        if (machine != null) sb.append(" · ").append(machine);
                        sb.append(")");
                    }
                    return sb.toString();
                }
                case "Style": {
                    String no = getFieldValue(entity, "styleNo");
                    String buyer = getFieldValue(entity, "buyer");
                    String prodType = getFieldValue(entity, "productType");
                    StringBuilder sb = new StringBuilder(actTitle).append(" Style ");
                    sb.append(no != null ? no : ("#" + entityId));
                    if (buyer != null || prodType != null) {
                        sb.append(" (");
                        if (prodType != null) sb.append(prodType).append(" · ");
                        if (buyer != null) sb.append("Buyer: ").append(buyer);
                        sb.append(")");
                    }
                    return sb.toString();
                }
                case "Size": {
                    String code = getFieldValue(entity, "code");
                    String label = getFieldValue(entity, "label");
                    StringBuilder sb = new StringBuilder(actTitle).append(" Size ");
                    sb.append(code != null ? code : ("#" + entityId));
                    if (label != null && !label.isEmpty()) {
                        sb.append(" (").append(label).append(")");
                    }
                    return sb.toString();
                }
                case "Order": {
                    String no = getFieldValue(entity, "orderNo");
                    String buyer = getFieldValue(entity, "buyer");
                    String qty = getFieldValue(entity, "totalQuantity");
                    String status = getFieldValue(entity, "status");
                    StringBuilder sb = new StringBuilder(actTitle).append(" Order ");
                    sb.append(no != null ? no : ("#" + entityId));
                    sb.append(" (");
                    if (buyer != null) sb.append("Buyer: ").append(buyer).append(" · ");
                    if (qty != null && !"0".equals(qty)) sb.append("Qty: ").append(qty).append(" pcs · ");
                    sb.append("Status: ").append(status != null ? status : "PLANNED").append(")");
                    return sb.toString();
                }
                case "SkillAssessment": {
                    String rating = getFieldValue(entity, "rating");
                    String sec = getFieldValue(entity, "cycleTimeSeconds");
                    return actTitle + " Skill Rating " + (rating != null ? rating : "") + 
                           (sec != null ? " (Avg Cycle Time: " + sec + "s)" : "");
                }
                case "OperatorPerformanceLog": {
                    String sec = getFieldValue(entity, "actualCycleTimeSeconds");
                    String status = getFieldValue(entity, "status");
                    return actTitle + " Performance Timing Test (" + (sec != null ? sec + "s" : "") + 
                           (status != null ? " · " + status : "") + ")";
                }
                case "AttendanceRecord": {
                    String date = getFieldValue(entity, "attendanceDate");
                    String status = getFieldValue(entity, "status");
                    return actTitle + " Attendance Record (" + (status != null ? status : "RECORDED") + 
                           (date != null ? " on " + date : "") + ")";
                }
                case "ShiftAssignment": {
                    String date = getFieldValue(entity, "assignmentDate");
                    return actTitle + " Shift Assignment" + (date != null ? " for " + date : "");
                }
                default:
                    return actTitle + " " + entityName + " #" + entityId;
            }
        } catch (Exception e) {
            return actTitle + " " + entityName + " #" + entityId;
        }
    }

    private String getFieldValue(Object entity, String fieldName) {
        try {
            Field f = findField(entity.getClass(), fieldName);
            if (f != null) {
                f.setAccessible(true);
                Object val = f.get(entity);
                return val != null ? val.toString() : null;
            }
        } catch (Exception ignored) {}
        return null;
    }

    private Field findField(Class<?> clazz, String fieldName) {
        Class<?> current = clazz;
        while (current != null && current != Object.class) {
            try {
                return current.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                current = current.getSuperclass();
            }
        }
        return null;
    }

    private String extractId(Object entity) {
        try {
            Field idField = findField(entity.getClass(), "id");
            if (idField != null) {
                idField.setAccessible(true);
                Object id = idField.get(entity);
                return id != null ? id.toString() : "Unknown";
            }
            return "Unknown";
        } catch (Exception e) {
            return "Unknown";
        }
    }
}
