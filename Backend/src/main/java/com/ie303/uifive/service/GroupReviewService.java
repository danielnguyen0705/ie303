package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.GroupReviewRequest;
import com.ie303.uifive.dto.res.GroupReviewResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.GroupReview;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.mapper.GroupReviewMapper;
import com.ie303.uifive.repo.GradeRepo;
import com.ie303.uifive.repo.GroupReviewRepo;
import com.ie303.uifive.repo.QuestionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupReviewService {

    private final GroupReviewRepo groupReviewRepo;
    private final GradeRepo gradeRepo;
    private final QuestionRepo questionRepo;
    private final GroupReviewMapper mapper;

    public GroupReviewResponse create(GroupReviewRequest request) {
        GroupReview entity = mapper.toEntity(request);

        if (request.gradeId() != null) {
            Grade grade = gradeRepo.findById(request.gradeId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Grade với id = " + request.gradeId()));
            entity.setGrade(grade);
        }

        if (request.questionIds() != null) {
            List<Question> questions = questionRepo.findAllById(request.questionIds());
            entity.setQuestions(questions);
        }

        entity = groupReviewRepo.save(entity);

        GroupReviewResponse response = mapper.toResponse(entity);
        return response;
    }

    public GroupReviewResponse getById(Long id) {
        GroupReview entity = groupReviewRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy GroupReview với id = " + id));

        GroupReviewResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<GroupReviewResponse> getAll() {
        List<GroupReview> entities = groupReviewRepo.findAll();

        List<GroupReviewResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public GroupReviewResponse update(Long id, GroupReviewRequest request) {
        GroupReview entity = groupReviewRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy GroupReview với id = " + id));

        mapper.updateEntityFromRequest(request, entity);

        if (request.gradeId() != null) {
            Grade grade = gradeRepo.findById(request.gradeId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Grade với id = " + request.gradeId()));
            entity.setGrade(grade);
        } else {
            entity.setGrade(null);
        }

        if (request.questionIds() != null) {
            List<Question> questions = questionRepo.findAllById(request.questionIds());
            entity.setQuestions(questions);
        } else {
            entity.setQuestions(null);
        }

        entity = groupReviewRepo.save(entity);

        GroupReviewResponse response = mapper.toResponse(entity);
        return response;
    }

    public void delete(Long id) {
        if (!groupReviewRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy GroupReview với id = " + id);
        }

        groupReviewRepo.deleteById(id);
    }
}