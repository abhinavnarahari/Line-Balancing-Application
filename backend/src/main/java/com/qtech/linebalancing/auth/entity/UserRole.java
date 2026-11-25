package com.qtech.linebalancing.auth.entity;

/**
 * Application roles. Names match the frontend {@code UserRole} type and are exposed to Spring Security
 * as {@code ROLE_<name>} authorities.
 */
public enum UserRole {
    SYSTEM_ADMIN("System Administrator"),
    INDUSTRIAL_ENGINEER("Industrial Engineer (IE)"),
    PRODUCTION_MANAGER("Production Manager"),
    LINE_SUPERVISOR("Line Supervisor");

    private final String title;

    UserRole(String title) {
        this.title = title;
    }

    public String getTitle() {
        return title;
    }
}
