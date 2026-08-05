package com.digitalarchive.service;

import com.digitalarchive.domain.entity.Department;
import com.digitalarchive.dto.DepartmentRequest;
import com.digitalarchive.dto.DepartmentResponse;
import com.digitalarchive.exception.ResourceNotFoundException;
import com.digitalarchive.mapper.ApiResponseMapper;
import com.digitalarchive.repository.DepartmentRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final ApiResponseMapper responseMapper;
    private final EntityManager entityManager;

    public List<DepartmentResponse> listActive() {
        return departmentRepository.findAll().stream()
                .filter(department -> department.getDeletedAt() == null)
                .map(responseMapper::toDepartmentResponse)
                .toList();
    }

    public Optional<DepartmentResponse> getActive(UUID departmentId) {
        return findActive(departmentId).map(responseMapper::toDepartmentResponse);
    }

    @Transactional
    public DepartmentResponse create(DepartmentRequest request, UUID actorId) {
        Department department = Department.builder()
                .name(request.name().trim())
                .description(request.description())
                .parentDepartment(resolveParent(request.parentDepartmentId(), null))
                .createdBy(actorId)
                .build();

        Department saved = departmentRepository.saveAndFlush(department);
        entityManager.refresh(saved);
        return responseMapper.toDepartmentResponse(saved);
    }

    @Transactional
    public Optional<DepartmentResponse> update(UUID departmentId, DepartmentRequest request, UUID actorId) {
        return findActive(departmentId).map(existing -> {
            existing.setName(request.name().trim());
            existing.setDescription(request.description());
            existing.setParentDepartment(resolveParent(request.parentDepartmentId(), departmentId));
            existing.setUpdatedBy(actorId);

            Department saved = departmentRepository.save(existing);
            return responseMapper.toDepartmentResponse(saved);
        });
    }

    @Transactional
    public boolean softDelete(UUID departmentId, UUID actorId) {
        return findActive(departmentId).map(existing -> {
            existing.setDeletedAt(OffsetDateTime.now());
            existing.setDeletedBy(actorId);
            departmentRepository.save(existing);
            return true;
        }).orElse(false);
    }

    private Optional<Department> findActive(UUID departmentId) {
        return departmentRepository.findById(departmentId)
                .filter(department -> department.getDeletedAt() == null);
    }

    private Department resolveParent(UUID parentDepartmentId, UUID departmentIdBeingUpdated) {
        if (parentDepartmentId == null) {
            return null;
        }
        if (parentDepartmentId.equals(departmentIdBeingUpdated)) {
            throw new IllegalArgumentException("A department cannot be its own parent");
        }
        return findActive(parentDepartmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parent department not found: " + parentDepartmentId));
    }
}
