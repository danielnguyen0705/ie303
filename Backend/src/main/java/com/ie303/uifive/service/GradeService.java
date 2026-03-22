package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.GradeRequest;
import com.ie303.uifive.dto.res.GradeResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.mapper.GradeMapper;
import com.ie303.uifive.repo.GradeRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GradeService {

    private final GradeRepo repo;
    private final GradeMapper mapper;

    // ================= CREATE =================
    public GradeResponse create(GradeRequest request) {
        Grade entity = mapper.toEntity(request);

        entity = repo.save(entity);

        GradeResponse response = mapper.toResponse(entity);
        return response;
    }

    // ================= GET =================
    public GradeResponse getById(Long id) {
        Grade entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Grade với id = " + id));

        GradeResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<GradeResponse> getAll() {
        List<Grade> entities = repo.findAll();

        List<GradeResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    // ================= UPDATE =================
    public GradeResponse update(Long id, GradeRequest request) {

        Grade entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Grade với id = " + id));

        mapper.updateEntityFromRequest(request, entity);

        entity = repo.save(entity);

        GradeResponse response = mapper.toResponse(entity);
        return response;
    }

    // ================= DELETE =================
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy Grade với id = " + id);
        }
        repo.deleteById(id);
    }
}