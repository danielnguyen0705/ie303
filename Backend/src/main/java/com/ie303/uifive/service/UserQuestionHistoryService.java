package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UserQuestionHistoryRequest;
import com.ie303.uifive.dto.res.UserQuestionHistoryResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserQuestionHistory;
import com.ie303.uifive.mapper.UserQuestionHistoryMapper;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserQuestionHistoryService {

    private final UserQuestionHistoryRepo repo;
    private final UserRepo userRepo;
    private final QuestionRepo questionRepo;
    private final UserQuestionHistoryMapper mapper;

    public UserQuestionHistoryResponse submit(UserQuestionHistoryRequest request) {
        User user = userRepo.findById(request.userId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User với id = " + request.userId()));

        Question question = questionRepo.findById(request.questionId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Question với id = " + request.questionId()));

        UserQuestionHistory history = repo.findByUserIdAndQuestionId(request.userId(), request.questionId())
                .orElseGet(() -> {
                    UserQuestionHistory entity = mapper.toEntity(request);
                    entity.setUser(user);
                    entity.setQuestion(question);
                    return entity;
                });

        mapper.updateEntityFromRequest(request, history);
        history.setUser(user);
        history.setQuestion(question);

        history = repo.save(history);

        UserQuestionHistoryResponse response = mapper.toResponse(history);
        return response;
    }

    public UserQuestionHistoryResponse getById(Long id) {
        UserQuestionHistory entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy UserQuestionHistory với id = " + id));

        UserQuestionHistoryResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<UserQuestionHistoryResponse> getAll() {
        List<UserQuestionHistory> entities = repo.findAll();

        List<UserQuestionHistoryResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public List<UserQuestionHistoryResponse> getByUserId(Long userId) {
        List<UserQuestionHistory> entities = repo.findByUserId(userId);

        List<UserQuestionHistoryResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy UserQuestionHistory với id = " + id);
        }

        repo.deleteById(id);
    }
}