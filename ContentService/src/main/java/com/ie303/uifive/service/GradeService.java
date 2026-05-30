package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.GradeRequest;
import com.ie303.uifive.dto.res.GradeResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.GradeRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GradeService {

    private final GradeRepo repo;
    private final ContentDeletionService contentDeletionService;

    public GradeResponse create(GradeRequest request) {
        Grade entity = new Grade();
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity = repo.save(entity);
        return toResponse(entity);
    }

    public GradeResponse getById(Long id) {
        return toResponse(findGrade(id));
    }

    public List<GradeResponse> getAll() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public GradeResponse update(Long id, GradeRequest request) {
        Grade entity = findGrade(id);
        entity.setName(request.name());
        entity.setDescription(request.description());
        return toResponse(repo.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new AppException(ErrorCode.GRADE_NOT_FOUND);
        }
        contentDeletionService.deleteGrade(id);
    }

    private Grade findGrade(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.GRADE_NOT_FOUND));
    }

    private GradeResponse toResponse(Grade entity) {
        return new GradeResponse(entity.getId(), entity.getName(), entity.getDescription());
    }
}
