package com.qtech.linebalancing.linedesign.repository;

import com.qtech.linebalancing.linedesign.entity.LineDesignMachine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LineDesignMachineRepository extends JpaRepository<LineDesignMachine, Long> {
    List<LineDesignMachine> findByLineDesignId(Long lineDesignId);
}
