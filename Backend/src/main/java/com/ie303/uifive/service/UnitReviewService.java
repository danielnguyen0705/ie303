package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UnitReviewRequest;
import com.ie303.uifive.dto.res.UnitReviewResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.Unit;
import com.ie303.uifive.entity.UnitReview;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.UnitReviewMapper;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UnitRepo;
import com.ie303.uifive.repo.UnitReviewRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UnitReviewService {

    private final UnitReviewRepo repo;
    private final UnitRepo unitRepo;
    private final QuestionRepo questionRepo;
    private final UnitReviewMapper mapper;
    private final UserService userService;
    private final UserQuestionHistoryRepo userQuestionHistoryRepo;

    public UnitReviewResponse create(UnitReviewRequest request) {
        User currentUser = userService.getCurrentUser();
        UnitReview entity = mapper.toEntity(request);

        Unit unit = unitRepo.findById(request.unitId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Unit với id = " + request.unitId()));

        entity.setUnit(unit);

        Set<Long> mergedQuestionIds = new LinkedHashSet<>();

        if (request.questionIds() != null) {
            mergedQuestionIds.addAll(request.questionIds());
        }

        if (Boolean.TRUE.equals(request.includeWrongQuestions())) {
            ensureVip(currentUser);
            List<Long> wrongQuestionIds = userQuestionHistoryRepo
                    .findDistinctWrongQuestionIdsByUserAndUnit(currentUser.getId(), unit.getId());
            mergedQuestionIds.addAll(wrongQuestionIds);
        }

        if (!mergedQuestionIds.isEmpty()) {
            List<Question> questions = questionRepo.findAllById(mergedQuestionIds);
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
        User currentUser = userService.getCurrentUser();
        UnitReview entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy UnitReview với id = " + id));

        mapper.updateEntityFromRequest(request, entity);

        Unit unit = unitRepo.findById(request.unitId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Unit với id = " + request.unitId()));

        entity.setUnit(unit);

        Set<Long> mergedQuestionIds = new LinkedHashSet<>();

        if (request.questionIds() != null) {
            mergedQuestionIds.addAll(request.questionIds());
        }

        if (Boolean.TRUE.equals(request.includeWrongQuestions())) {
            ensureVip(currentUser);
            List<Long> wrongQuestionIds = userQuestionHistoryRepo
                    .findDistinctWrongQuestionIdsByUserAndUnit(currentUser.getId(), unit.getId());
            mergedQuestionIds.addAll(wrongQuestionIds);
        }

        if (!mergedQuestionIds.isEmpty()) {
            List<Question> questions = questionRepo.findAllById(mergedQuestionIds);
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

    private void ensureVip(User user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (user.getVipExpiredAt() == null || !user.getVipExpiredAt().isAfter(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VIP_REQUIRED);
        }
    }
}