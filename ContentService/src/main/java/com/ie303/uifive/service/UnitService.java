package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UnitRequest;
import com.ie303.uifive.dto.res.UnitResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.Unit;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.GradeRepo;
import com.ie303.uifive.repo.UnitRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UnitService {

    private final UnitRepo unitRepo;
    private final GradeRepo gradeRepo;
    private final ContentDeletionService contentDeletionService;

    public UnitResponse create(UnitRequest request) {
        Unit entity = new Unit();
        entity.setUnitNumber(request.unitNumber());
        entity.setTitle(request.title());
        entity.setDescription(request.description());
        entity.setOrderIndex(request.orderIndex());

        Grade grade = gradeRepo.findById(request.gradeId())
                .orElseThrow(() -> new AppException(ErrorCode.GRADE_NOT_FOUND));
        entity.setGrade(grade);

        return toResponse(unitRepo.save(entity));
    }

    public UnitResponse getById(Long id) {
        return toResponse(findUnit(id));
    }

    public List<UnitResponse> getAll() {
        return unitRepo.findAll().stream().map(this::toResponse).toList();
    }

    public UnitResponse update(Long id, UnitRequest request) {
        Unit entity = findUnit(id);
        entity.setUnitNumber(request.unitNumber());
        entity.setTitle(request.title());
        entity.setDescription(request.description());
        entity.setOrderIndex(request.orderIndex());

        Grade grade = gradeRepo.findById(request.gradeId())
                .orElseThrow(() -> new AppException(ErrorCode.GRADE_NOT_FOUND));
        entity.setGrade(grade);

        return toResponse(unitRepo.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!unitRepo.existsById(id)) {
            throw new AppException(ErrorCode.UNIT_NOT_FOUND);
        }
        contentDeletionService.deleteUnit(id);
    }

    private Unit findUnit(Long id) {
        return unitRepo.findById(id).orElseThrow(() -> new AppException(ErrorCode.UNIT_NOT_FOUND));
    }

    private UnitResponse toResponse(Unit entity) {
        return new UnitResponse(entity.getId(), entity.getUnitNumber(), entity.getTitle(), entity.getDescription(), entity.getGrade() == null ? null : entity.getGrade().getId());
    }
}
