package com.qtech.linebalancing.size.repository;

import com.qtech.linebalancing.size.entity.Size;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SizeRepository extends JpaRepository<Size, Long> {
    List<Size> findAllByOrderBySequenceAsc();
    List<Size> findByActiveOrderBySequenceAsc(boolean active);
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
}
