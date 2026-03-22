package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SemesterTestRequest;
import com.ie303.uifive.dto.res.SemesterTestResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.SemesterTest;
import com.ie303.uifive.mapper.SemesterTestMapper;
import com.ie303.uifive.repo.GradeRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.SemesterTestRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SemesterTestService {

    private final SemesterTestRepo repo;
    private final GradeRepo gradeRepo;
    private final QuestionRepo questionRepo;
    private final SemesterTestMapper mapper;

    public SemesterTestResponse create(SemesterTestRequest request) {
        if (request.startUnit() > request.endUnit()) {
            throw new RuntimeException("startUnit phải nhỏ hơn hoặc bằng endUnit");
        }

        SemesterTest entity = mapper.toEntity(request);

        if (request.gradeId() != null) {
            Grade grade = gradeRepo.findById(request.gradeId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Grade với id = " + request.gradeId()));
            entity.setGrade(grade);
        }

        if (request.questionIds() != null) {
            List<Question> questions = questionRepo.findAllById(request.questionIds());
            entity.setQuestions(questions);
        }

        entity = repo.save(entity);

        SemesterTestResponse response = mapper.toResponse(entity);
        return response;
    }

    public SemesterTestResponse getById(Long id) {
        SemesterTest entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy SemesterTest với id = " + id));

        SemesterTestResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<SemesterTestResponse> getAll() {
        List<SemesterTest> entities = repo.findAll();

        List<SemesterTestResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public SemesterTestResponse update(Long id, SemesterTestRequest request) {
        if (request.startUnit() > request.endUnit()) {
            throw new RuntimeException("startUnit phải nhỏ hơn hoặc bằng endUnit");
        }

        SemesterTest entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy SemesterTest với id = " + id));

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

        entity = repo.save(entity);

        SemesterTestResponse response = mapper.toResponse(entity);
        return response;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy SemesterTest với id = " + id);
        }

        repo.deleteById(id);
    }
}