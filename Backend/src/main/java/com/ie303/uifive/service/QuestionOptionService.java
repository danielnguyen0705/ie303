package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.QuestionOptionRequest;
import com.ie303.uifive.dto.res.QuestionOptionResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionOption;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
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
        entity.setCorrect(request.isCorrect());

        Question question = questionRepo.findById(request.questionId())
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        entity.setQuestion(question);

        entity.setCorrect(request.isCorrect());
        entity = repo.save(entity);

        QuestionOptionResponse response = mapper.toResponse(entity);
        return response;
    }

    public QuestionOptionResponse getById(Long id) {
        QuestionOption entity = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Question option not found"));

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
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Question option not found"));

        mapper.updateEntityFromRequest(request, entity);
        entity.setCorrect(request.isCorrect());

        Question question = questionRepo.findById(request.questionId())
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        entity.setQuestion(question);

        entity = repo.save(entity);

        QuestionOptionResponse response = mapper.toResponse(entity);
        return response;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Question option not found");
        }

        repo.deleteById(id);
    }
}
