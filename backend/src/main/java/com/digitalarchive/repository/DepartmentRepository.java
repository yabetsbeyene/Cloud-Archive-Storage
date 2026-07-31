package com.digitalarchive.repository;

import com.digitalarchive.domain.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    long countByDeletedAtIsNull();
}
