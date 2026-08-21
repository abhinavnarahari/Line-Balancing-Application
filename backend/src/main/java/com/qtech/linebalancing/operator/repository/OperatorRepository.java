package com.qtech.linebalancing.operator.repository;

import com.qtech.linebalancing.operator.entity.Operator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperatorRepository extends JpaRepository<Operator, Long> {

    boolean existsByEmployeeIdIgnoreCase(String employeeId);

    boolean existsByEmployeeIdIgnoreCaseAndIdNot(String employeeId, Long id);

    Optional<Operator> findByEmployeeIdIgnoreCase(String employeeId);

    List<Operator> findByActiveOrderByNameAsc(boolean active);

    @Query("""
            SELECT o FROM Operator o
            WHERE (:active IS NULL OR o.active = :active)
              AND (:search IS NULL OR :search = ''
                   OR LOWER(o.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.employeeId) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.department) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY o.name ASC
            """)
    List<Operator> searchOperators(@Param("search") String search, @Param("active") Boolean active);
}
