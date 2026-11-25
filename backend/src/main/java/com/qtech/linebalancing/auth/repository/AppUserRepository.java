package com.qtech.linebalancing.auth.repository;

import com.qtech.linebalancing.auth.entity.AppUser;
import com.qtech.linebalancing.auth.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByRoleAndActiveTrue(UserRole role);

    List<AppUser> findAllByOrderByFullNameAsc();
}
