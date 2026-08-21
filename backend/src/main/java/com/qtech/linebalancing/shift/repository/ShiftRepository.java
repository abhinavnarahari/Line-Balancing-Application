package com.qtech.linebalancing.shift.repository;

import com.qtech.linebalancing.shift.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {

    List<Shift> findAllByOrderByShiftCodeAsc();

    List<Shift> findByActiveOrderByShiftCodeAsc(boolean active);

    Optional<Shift> findByShiftCodeIgnoreCase(String shiftCode);

    boolean existsByShiftCodeIgnoreCase(String shiftCode);

    boolean existsByShiftCodeIgnoreCaseAndIdNot(String shiftCode, Long id);
}
