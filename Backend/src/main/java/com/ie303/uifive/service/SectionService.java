package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SectionRequest;
import com.ie303.uifive.dto.res.SectionResponse;
import com.ie303.uifive.entity.Section;
import com.ie303.uifive.entity.Unit;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.SectionMapper;
import com.ie303.uifive.repo.SectionRepo;
import com.ie303.uifive.repo.UnitRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SectionService {

    private final SectionRepo sectionRepo;
    private final UnitRepo unitRepo;
    private final SectionMapper mapper;
    private final ContentDeletionService contentDeletionService;

    @CacheEvict(cacheNames = {
            "sections",
            "lessons",
            "progress-units-sections",
            "progress-sections-lessons"
    }, allEntries = true)
    public SectionResponse create(SectionRequest request) {
        Section entity = mapper.toEntity(request);

        Unit unit = unitRepo.findById(request.unitId())
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_NOT_FOUND));

        entity.setUnit(unit);

        entity = sectionRepo.save(entity);

        SectionResponse response = mapper.toResponse(entity);
        return response;
    }

    @Cacheable(cacheNames = "sections", key = "#id")
    public SectionResponse getById(Long id) {
        Section entity = sectionRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        SectionResponse response = mapper.toResponse(entity);
        return response;
    }

    @Cacheable(cacheNames = "sections", key = "'all'")
    public List<SectionResponse> getAll() {
        List<Section> entities = sectionRepo.findAll();

        List<SectionResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    @CacheEvict(cacheNames = {
            "sections",
            "lessons",
            "progress-units-sections",
            "progress-sections-lessons"
    }, allEntries = true)
    public SectionResponse update(Long id, SectionRequest request) {
        Section entity = sectionRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        mapper.updateEntityFromRequest(request, entity);

        Unit unit = unitRepo.findById(request.unitId())
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_NOT_FOUND));

        entity.setUnit(unit);

        entity = sectionRepo.save(entity);

        SectionResponse response = mapper.toResponse(entity);
        return response;
    }

    @Transactional
    @CacheEvict(cacheNames = {
            "sections",
            "lessons",
            "progress-units-sections",
            "progress-sections-lessons"
    }, allEntries = true)
    public void delete(Long id) {
        if (!sectionRepo.existsById(id)) {
            throw new AppException(ErrorCode.SECTION_NOT_FOUND);
        }

        contentDeletionService.deleteSection(id);
    }
}
