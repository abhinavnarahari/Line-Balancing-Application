package com.qtech.linebalancing.masterdata;

import com.qtech.linebalancing.lineplan.dto.LinePlanRequest;
import com.qtech.linebalancing.lineplan.service.LinePlanService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Save Plan vs Approve & Release. Requires the local PostgreSQL; all changes are rolled back. */
@SpringBootTest
@Transactional
class LinePlanSaveStatusTest {

    @Autowired private LinePlanService service;
    @Autowired private JdbcTemplate jdbc;

    private LinePlanRequest request(Boolean release) {
        Long styleId = jdbc.queryForObject("INSERT INTO styles (style_no) VALUES ('ZZ-LP-ST') RETURNING id", Long.class);
        Long orderId = jdbc.queryForObject("INSERT INTO orders (order_no, style_id, color, order_date, delivery_date, status, total_quantity) "
                + "VALUES ('ZZ-LP-1', ?, 'Navy', CURRENT_DATE, CURRENT_DATE + 30, 'PLANNED', 100) RETURNING id", Long.class, styleId);
        Long shiftId = jdbc.queryForObject("INSERT INTO shifts (shift_code, shift_name, start_time, end_time, break_duration_minutes, active) "
                + "VALUES ('ZZLP', 'ZZ LP', '09:00', '17:00', 30, true) RETURNING id", Long.class);
        LinePlanRequest r = new LinePlanRequest();
        r.setOrderId(orderId); r.setShiftId(shiftId); r.setAssignments(List.of()); r.setRelease(release);
        return r;
    }

    @Test
    void saveOnlyKeepsANewPlanAsDraftAndReleaseMakesItActive() {
        LinePlanRequest r = request(false);
        assertThat(service.savePlan(r).getStatus()).isEqualTo("draft");
        r.setRelease(true);
        assertThat(service.savePlan(r).getStatus()).isEqualTo("active");
        r.setRelease(false); // saving changes later doesn't un-release it
        assertThat(service.savePlan(r).getStatus()).isEqualTo("active");
    }

    @Test
    void oldClientsWithoutTheFlagStillRelease() {
        LinePlanRequest r = request(null);
        assertThat(service.savePlan(r).getStatus()).isEqualTo("active");
    }
}
