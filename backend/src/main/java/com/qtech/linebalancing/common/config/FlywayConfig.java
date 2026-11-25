package com.qtech.linebalancing.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Migrations are validated on startup (edited or deleted already-applied migrations stop the app instead of
 * silently diverging). For an environment whose history predates that rule, start once with
 * FLYWAY_REPAIR_ON_START=true: Flyway re-aligns checksums and drops history rows of deleted migration files.
 * Repair only touches the flyway_schema_history table, never application data.
 */
@Slf4j
@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(
            @Value("${app.flyway.repair-on-start:false}") boolean repairOnStart) {
        return flyway -> {
            if (repairOnStart) {
                log.warn("FLYWAY_REPAIR_ON_START=true: repairing flyway_schema_history before migrating. "
                        + "Remove the flag after this start.");
                flyway.repair();
            }
            flyway.migrate();
        };
    }
}
