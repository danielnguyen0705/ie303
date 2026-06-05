package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UnitRequest;
import com.ie303.uifive.dto.res.UnitResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.Unit;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.UnitMapper;
import com.ie303.uifive.repo.GradeRepo;
import com.ie303.uifive.repo.UnitRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UnitService {

    private final UnitRepo unitRepo;
    private final GradeRepo gradeRepo;
    private final UnitMapper mapper;
    private final ContentDeletionService contentDeletionService;

    @CacheEvict(cacheNames = {
            "units",
            "sections",
            "lessons",
            "progress-grades-units",
            "progress-units-sections",
            "progress-sections-lessons"
    }, allEntries = true)
    public UnitResponse create(UnitRequest request) {
        Unit entity = mapper.toEntity(request);

        Grade grade = gradeRepo.findById(request.gradeId())
                .orElseThrow(() -> new AppException(ErrorCode.GRADE_NOT_FOUND));

        entity.setGrade(grade);

        entity = unitRepo.save(entity);

        UnitResponse response = mapper.toResponse(entity);
        return response;
    }

    @Cacheable(cacheNames = "units", key = "#id")
    public UnitResponse getById(Long id) {
        Unit entity = unitRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_NOT_FOUND));

        UnitResponse response = mapper.toResponse(entity);
        return response;
    }

    @Cacheable(cacheNames = "units", key = "'all'")
    public List<UnitResponse> getAll() {
        List<Unit> entities = unitRepo.findAll();

        List<UnitResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    @Cacheable(cacheNames = "units", key = "'grade:' + #gradeId")
    public List<UnitResponse> getByGradeId(Long gradeId) {
        if (!gradeRepo.existsById(gradeId)) {
            throw new AppException(ErrorCode.GRADE_NOT_FOUND);
        }

        return unitRepo.findByGradeIdOrderByUnitNumberAsc(gradeId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @CacheEvict(cacheNames = {
            "units",
            "sections",
            "lessons",
            "progress-grades-units",
            "progress-units-sections",
            "progress-sections-lessons"
    }, allEntries = true)
    public UnitResponse update(Long id, UnitRequest request) {
        Unit entity = unitRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_NOT_FOUND));

        mapper.updateEntityFromRequest(request, entity);

        Grade grade = gradeRepo.findById(request.gradeId())
                .orElseThrow(() -> new AppException(ErrorCode.GRADE_NOT_FOUND));

        entity.setGrade(grade);

        entity = unitRepo.save(entity);

        UnitResponse response = mapper.toResponse(entity);
        return response;
    }

    @Transactional
    @CacheEvict(cacheNames = {
            "units",
            "sections",
            "lessons",
            "progress-grades-units",
            "progress-units-sections",
            "progress-sections-lessons"
    }, allEntries = true)
    public void delete(Long id) {
        if (!unitRepo.existsById(id)) {
            throw new AppException(ErrorCode.UNIT_NOT_FOUND);
        }

        contentDeletionService.deleteUnit(id);
    }
}
