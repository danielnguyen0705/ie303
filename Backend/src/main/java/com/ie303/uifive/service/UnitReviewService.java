package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UnitReviewRequest;
import com.ie303.uifive.dto.res.UnitReviewResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.Unit;
import com.ie303.uifive.entity.UnitReview;
import com.ie303.uifive.mapper.UnitReviewMapper;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UnitRepo;
import com.ie303.uifive.repo.UnitReviewRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UnitReviewService {

    private final UnitReviewRepo repo;
    private final UnitRepo unitRepo;
    private final QuestionRepo questionRepo;
    private final UnitReviewMapper mapper;

    public UnitReviewResponse create(UnitReviewRequest request) {
        UnitReview entity = mapper.toEntity(request);

        Unit unit = unitRepo.findById(request.unitId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Unit với id = " + request.unitId()));

        entity.setUnit(unit);

        if (request.questionIds() != null) {
            List<Question> questions = questionRepo.findAllById(request.questionIds());
            entity.setQuestions(questions);
        }

        entity = repo.save(entity);

        UnitReviewResponse response = mapper.toResponse(entity);
        return response;
    }

    public UnitReviewResponse getById(Long id) {
        UnitReview entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy UnitReview với id = " + id));

        UnitReviewResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<UnitReviewResponse> getAll() {
        List<UnitReview> entities = repo.findAll();

        List<UnitReviewResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public UnitReviewResponse update(Long id, UnitReviewRequest request) {
        UnitReview entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy UnitReview với id = " + id));

        mapper.updateEntityFromRequest(request, entity);

        Unit unit = unitRepo.findById(request.unitId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Unit với id = " + request.unitId()));

        entity.setUnit(unit);

        if (request.questionIds() != null) {
            List<Question> questions = questionRepo.findAllById(request.questionIds());
            entity.setQuestions(questions);
        } else {
            entity.setQuestions(null);
        }

        entity = repo.save(entity);

        UnitReviewResponse response = mapper.toResponse(entity);
        return response;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy UnitReview với id = " + id);
        }

        repo.deleteById(id);
    }
}