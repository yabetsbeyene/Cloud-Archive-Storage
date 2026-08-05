package com.digitalarchive.service;

import com.digitalarchive.domain.entity.Category;
import com.digitalarchive.dto.CategoryRequest;
import com.digitalarchive.dto.CategoryResponse;
import com.digitalarchive.exception.ResourceNotFoundException;
import com.digitalarchive.mapper.ApiResponseMapper;
import com.digitalarchive.repository.CategoryRepository;
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
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ApiResponseMapper responseMapper;
    private final EntityManager entityManager;

    public List<CategoryResponse> listActive() {
        return categoryRepository.findAll().stream()
                .filter(category -> category.getDeletedAt() == null)
                .map(responseMapper::toCategoryResponse)
                .toList();
    }

    public Optional<CategoryResponse> getActive(UUID categoryId) {
        return findActive(categoryId).map(responseMapper::toCategoryResponse);
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request, UUID actorId) {
        Category category = Category.builder()
                .name(request.name().trim())
                .description(request.description())
                .parentCategory(resolveParent(request.parentCategoryId(), null))
                .retentionPeriodMonths(request.retentionPeriodMonths())
                .createdBy(actorId)
                .build();

        Category saved = categoryRepository.saveAndFlush(category);
        entityManager.refresh(saved);
        return responseMapper.toCategoryResponse(saved);
    }

    @Transactional
    public Optional<CategoryResponse> update(UUID categoryId, CategoryRequest request, UUID actorId) {
        return findActive(categoryId).map(existing -> {
            existing.setName(request.name().trim());
            existing.setDescription(request.description());
            existing.setParentCategory(resolveParent(request.parentCategoryId(), categoryId));
            existing.setRetentionPeriodMonths(request.retentionPeriodMonths());
            existing.setUpdatedBy(actorId);

            Category saved = categoryRepository.save(existing);
            return responseMapper.toCategoryResponse(saved);
        });
    }

    @Transactional
    public boolean softDelete(UUID categoryId, UUID actorId) {
        return findActive(categoryId).map(existing -> {
            existing.setDeletedAt(OffsetDateTime.now());
            existing.setDeletedBy(actorId);
            categoryRepository.save(existing);
            return true;
        }).orElse(false);
    }

    private Optional<Category> findActive(UUID categoryId) {
        return categoryRepository.findById(categoryId)
                .filter(category -> category.getDeletedAt() == null);
    }

    private Category resolveParent(UUID parentCategoryId, UUID categoryIdBeingUpdated) {
        if (parentCategoryId == null) {
            return null;
        }
        if (parentCategoryId.equals(categoryIdBeingUpdated)) {
            throw new IllegalArgumentException("A category cannot be its own parent");
        }
        return findActive(parentCategoryId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parent category not found: " + parentCategoryId));
    }
}
