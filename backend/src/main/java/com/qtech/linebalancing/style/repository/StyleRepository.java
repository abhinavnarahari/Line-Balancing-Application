package com.qtech.linebalancing.style.repository;

import com.qtech.linebalancing.style.entity.Style;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StyleRepository extends JpaRepository<Style, Long> {
    List<Style> findAllByOrderByStyleNoAsc();
    List<Style> findByActiveOrderByStyleNoAsc(boolean active);
    boolean existsByStyleNoIgnoreCase(String styleNo);
    boolean existsByStyleNoIgnoreCaseAndIdNot(String styleNo, Long id);
}
