package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SectionRequest;
import com.ie303.uifive.dto.res.SectionResponse;
import com.ie303.uifive.entity.Section;
import com.ie303.uifive.entity.Unit;
import com.ie303.uifive.mapper.SectionMapper;
import com.ie303.uifive.repo.SectionRepo;
import com.ie303.uifive.repo.UnitRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SectionService {

    private final SectionRepo sectionRepo;
    private final UnitRepo unitRepo;
    private final SectionMapper mapper;

    public SectionResponse create(SectionRequest request) {
        Section entity = mapper.toEntity(request);

        Unit unit = unitRepo.findById(request.unitId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Unit với id = " + request.unitId()));

        entity.setUnit(unit);

        entity = sectionRepo.save(entity);

        SectionResponse response = mapper.toResponse(entity);
        return response;
    }

    public SectionResponse getById(Long id) {
        Section entity = sectionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Section với id = " + id));

        SectionResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<SectionResponse> getAll() {
        List<Section> entities = sectionRepo.findAll();

        List<SectionResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public SectionResponse update(Long id, SectionRequest request) {
        Section entity = sectionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Section với id = " + id));

        mapper.updateEntityFromRequest(request, entity);

        Unit unit = unitRepo.findById(request.unitId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Unit với id = " + request.unitId()));

        entity.setUnit(unit);

        entity = sectionRepo.save(entity);

        SectionResponse response = mapper.toResponse(entity);
        return response;
    }

    public void delete(Long id) {
        if (!sectionRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy Section với id = " + id);
        }

        sectionRepo.deleteById(id);
    }
}