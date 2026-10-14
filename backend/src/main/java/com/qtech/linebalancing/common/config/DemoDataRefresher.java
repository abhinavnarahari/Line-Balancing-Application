package com.qtech.linebalancing.common.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Keeps the date-based sample data (attendance, piece production logs) available for "today".
 * The seed migrations only create these rows for the deployment day, so without this the
 * demo screens go empty the next day. Only fills dates that have no records, so it never
 * overwrites real data. Disable with DEMO_DATA_DAILY_REFRESH=false for real factory use.
 */
@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.demo-data.daily-refresh", havingValue = "true")
public class DemoDataRefresher {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        refreshToday();
    }

    @Scheduled(cron = "0 1 0 * * *")
    public void refreshToday() {
        LocalDate today = LocalDate.now();
        try {
            jdbcTemplate.execute("SELECT refresh_daily_demo_data('" + today + "'::date)");
            log.info("Daily sample data ensured for {}", today);
        } catch (Exception e) {
            log.warn("Daily sample data refresh failed for {}: {}", today, e.getMessage());
        }
    }
}
