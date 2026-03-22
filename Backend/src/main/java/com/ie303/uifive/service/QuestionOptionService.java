package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.QuestionOptionRequest;
import com.ie303.uifive.dto.res.QuestionOptionResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionOption;
import com.ie303.uifive.mapper.QuestionOptionMapper;
import com.ie303.uifive.repo.QuestionOptionRepo;
import com.ie303.uifive.repo.QuestionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionOptionService {

    private final QuestionOptionRepo repo;
    private final QuestionRepo questionRepo;
    private final QuestionOptionMapper mapper;

    public QuestionOptionResponse create(QuestionOptionRequest request) {
        QuestionOption entity = mapper.toEntity(request);

        Question question = questionRepo.findById(request.questionId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Question với id = " + request.questionId()));

        entity.setQuestion(question);

        entity = repo.save(entity);

        QuestionOptionResponse response = mapper.toResponse(entity);
        return response;
    }

    public QuestionOptionResponse getById(Long id) {
        QuestionOption entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy QuestionOption với id = " + id));

        QuestionOptionResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<QuestionOptionResponse> getAll() {
        List<QuestionOption> entities = repo.findAll();

        List<QuestionOptionResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public QuestionOptionResponse update(Long id, QuestionOptionRequest request) {
        QuestionOption entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy QuestionOption với id = " + id));

        mapper.updateEntityFromRequest(request, entity);

        Question question = questionRepo.findById(request.questionId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Question với id = " + request.questionId()));

        entity.setQuestion(question);

        entity = repo.save(entity);

        QuestionOptionResponse response = mapper.toResponse(entity);
        return response;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy QuestionOption với id = " + id);
        }

        repo.deleteById(id);
    }
}