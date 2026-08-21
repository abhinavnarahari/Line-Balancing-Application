package com.qtech.linebalancing.attendance.repository;

import com.qtech.linebalancing.attendance.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findByAttendanceDateAndShiftIdOrderByOperatorId(LocalDate date, Long shiftId);

    List<AttendanceRecord> findByAttendanceDateOrderByOperatorId(LocalDate date);

    Optional<AttendanceRecord> findByAttendanceDateAndOperatorIdAndShiftId(
            LocalDate date, Long operatorId, Long shiftId);

    List<AttendanceRecord> findByOperatorIdOrderByAttendanceDateDesc(Long operatorId);
}
