package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SectionRequest;
import com.ie303.uifive.dto.res.SectionResponse;
import com.ie303.uifive.entity.Section;
import com.ie303.uifive.entity.Unit;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.SectionRepo;
import com.ie303.uifive.repo.UnitRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SectionService {

    private final SectionRepo sectionRepo;
    private final UnitRepo unitRepo;
    private final ContentDeletionService contentDeletionService;

    public SectionResponse create(SectionRequest request) {
        Section entity = new Section();
        entity.setSectionNumber(request.sectionNumber());
        entity.setTitle(request.title());
        entity.setSectionType(request.sectionType());
        entity.setOrderIndex(request.orderIndex());

        Unit unit = unitRepo.findById(request.unitId())
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_NOT_FOUND));
        entity.setUnit(unit);

        return toResponse(sectionRepo.save(entity));
    }

    public SectionResponse getById(Long id) {
        return toResponse(findSection(id));
    }

    public List<SectionResponse> getAll() {
        return sectionRepo.findAll().stream().map(this::toResponse).toList();
    }

    public SectionResponse update(Long id, SectionRequest request) {
        Section entity = findSection(id);
        entity.setSectionNumber(request.sectionNumber());
        entity.setTitle(request.title());
        entity.setSectionType(request.sectionType());
        entity.setOrderIndex(request.orderIndex());

        Unit unit = unitRepo.findById(request.unitId())
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_NOT_FOUND));
        entity.setUnit(unit);

        return toResponse(sectionRepo.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!sectionRepo.existsById(id)) {
            throw new AppException(ErrorCode.SECTION_NOT_FOUND);
        }
        contentDeletionService.deleteSection(id);
    }

    private Section findSection(Long id) {
        return sectionRepo.findById(id).orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));
    }

    private SectionResponse toResponse(Section entity) {
        return new SectionResponse(
                entity.getId(),
                entity.getSectionNumber(),
                entity.getTitle(),
                entity.getSectionType(),
                entity.getUnit() == null ? null : entity.getUnit().getId()
        );
    }
}
