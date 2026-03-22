package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UnitRequest;
import com.ie303.uifive.dto.res.UnitResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.Unit;
import com.ie303.uifive.mapper.UnitMapper;
import com.ie303.uifive.repo.GradeRepo;
import com.ie303.uifive.repo.UnitRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UnitService {

    private final UnitRepo unitRepo;
    private final GradeRepo gradeRepo;
    private final UnitMapper mapper;

    public UnitResponse create(UnitRequest request) {
        Unit entity = mapper.toEntity(request);

        Grade grade = gradeRepo.findById(request.gradeId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Grade với id = " + request.gradeId()));

        entity.setGrade(grade);

        entity = unitRepo.save(entity);

        UnitResponse response = mapper.toResponse(entity);
        return response;
    }

    public UnitResponse getById(Long id) {
        Unit entity = unitRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Unit với id = " + id));

        UnitResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<UnitResponse> getAll() {
        List<Unit> entities = unitRepo.findAll();

        List<UnitResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public UnitResponse update(Long id, UnitRequest request) {
        Unit entity = unitRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Unit với id = " + id));

        mapper.updateEntityFromRequest(request, entity);

        Grade grade = gradeRepo.findById(request.gradeId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Grade với id = " + request.gradeId()));

        entity.setGrade(grade);

        entity = unitRepo.save(entity);

        UnitResponse response = mapper.toResponse(entity);
        return response;
    }

    public void delete(Long id) {
        if (!unitRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy Unit với id = " + id);
        }

        unitRepo.deleteById(id);
    }
}