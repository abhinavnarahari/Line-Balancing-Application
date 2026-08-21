package com.qtech.linebalancing.operationbulletin.repository;

import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperationBulletinRepository extends JpaRepository<OperationBulletin, Long> {
    List<OperationBulletin> findAllByOrderByCreatedAtDesc();
    boolean existsByBulletinCodeIgnoreCaseAndVersion(String bulletinCode, Integer version);
    boolean existsByBulletinCodeIgnoreCaseAndVersionAndIdNot(String bulletinCode, Integer version, Long id);
}
