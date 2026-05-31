package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SemesterTestRequest;
import com.ie303.uifive.dto.res.SemesterTestResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionGroup;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.SemesterTest;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.SemesterTestMapper;
import com.ie303.uifive.repo.GradeRepo;
import com.ie303.uifive.repo.QuestionGroupRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.SemesterTestRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SemesterTestService {

    private final SemesterTestRepo repo;
    private final GradeRepo gradeRepo;
    private final QuestionRepo questionRepo;
    private final QuestionGroupRepo questionGroupRepo;
    private final SemesterTestMapper mapper;
    private final UserService userService;
    private final UserQuestionHistoryRepo userQuestionHistoryRepo;

    public String currentUserCacheKey() {
        User user = userService.getCurrentUser();
        return user.getId() + ":" + user.getRole() + ":" + user.getVipExpiredAt();
    }

    @CacheEvict(cacheNames = "semester-tests", allEntries = true)
    public SemesterTestResponse create(SemesterTestRequest request) {
        User currentUser = userService.getCurrentUser();
        ensureVip(currentUser);

        if (request.startUnit() > request.endUnit()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "startUnit must be <= endUnit");
        }

        SemesterTest entity = mapper.toEntity(request);

        if (request.gradeId() != null) {
            Grade grade = gradeRepo.findById(request.gradeId())
                    .orElseThrow(() -> new AppException(ErrorCode.GRADE_NOT_FOUND));
            entity.setGrade(grade);
        }

        Set<Long> mergedQuestionIds = new LinkedHashSet<>();

        if (request.questionIds() != null) {
            mergedQuestionIds.addAll(request.questionIds());
        }

        if (Boolean.TRUE.equals(request.includeWrongQuestions()) && request.gradeId() != null) {
            List<Long> wrongQuestionIds = userQuestionHistoryRepo
                    .findDistinctWrongQuestionIdsByUserAndGradeAndUnitRange(
                            currentUser.getId(),
                            request.gradeId(),
                            request.startUnit(),
                            request.endUnit()
                    );
            mergedQuestionIds.addAll(wrongQuestionIds);
        }

        if (!mergedQuestionIds.isEmpty()) {
            List<Question> questions = questionRepo.findAllById(mergedQuestionIds);
            entity.setQuestions(questions);
        }

        if (request.questionGroupIds() != null) {
            List<QuestionGroup> questionGroups = questionGroupRepo.findAllById(request.questionGroupIds());
            entity.setQuestionGroups(questionGroups);
        }

        entity = repo.save(entity);

        SemesterTestResponse response = mapper.toResponse(entity);
        return response;
    }

    @Cacheable(cacheNames = "semester-tests", key = "#root.target.currentUserCacheKey() + ':' + #id")
    public SemesterTestResponse getById(Long id) {
        ensureVip(userService.getCurrentUser());

        SemesterTest entity = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Semester test not found"));

        SemesterTestResponse response = mapper.toResponse(entity);
        return response;
    }

    @Cacheable(cacheNames = "semester-tests", key = "#root.target.currentUserCacheKey() + ':list'")
    public List<SemesterTestResponse> getAll() {
        ensureVip(userService.getCurrentUser());

        List<SemesterTest> entities = repo.findAll();

        List<SemesterTestResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    @CacheEvict(cacheNames = "semester-tests", allEntries = true)
    public SemesterTestResponse update(Long id, SemesterTestRequest request) {
        User currentUser = userService.getCurrentUser();
        ensureVip(currentUser);

        if (request.startUnit() > request.endUnit()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "startUnit must be <= endUnit");
        }

        SemesterTest entity = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Semester test not found"));

        mapper.updateEntityFromRequest(request, entity);

        if (request.gradeId() != null) {
            Grade grade = gradeRepo.findById(request.gradeId())
                    .orElseThrow(() -> new AppException(ErrorCode.GRADE_NOT_FOUND));
            entity.setGrade(grade);
        } else {
            entity.setGrade(null);
        }

        Set<Long> mergedQuestionIds = new LinkedHashSet<>();

        if (request.questionIds() != null) {
            mergedQuestionIds.addAll(request.questionIds());
        }

        if (Boolean.TRUE.equals(request.includeWrongQuestions()) && request.gradeId() != null) {
            List<Long> wrongQuestionIds = userQuestionHistoryRepo
                    .findDistinctWrongQuestionIdsByUserAndGradeAndUnitRange(
                            currentUser.getId(),
                            request.gradeId(),
                            request.startUnit(),
                            request.endUnit()
                    );
            mergedQuestionIds.addAll(wrongQuestionIds);
        }

        if (!mergedQuestionIds.isEmpty()) {
            List<Question> questions = questionRepo.findAllById(mergedQuestionIds);
            entity.setQuestions(questions);
        } else {
            entity.setQuestions(null);
        }

        if (request.questionGroupIds() != null) {
            List<QuestionGroup> questionGroups = questionGroupRepo.findAllById(request.questionGroupIds());
            entity.setQuestionGroups(questionGroups);
        } else {
            entity.setQuestionGroups(null);
        }

        entity = repo.save(entity);

        SemesterTestResponse response = mapper.toResponse(entity);
        return response;
    }

    @CacheEvict(cacheNames = "semester-tests", allEntries = true)
    public void delete(Long id) {
        ensureVip(userService.getCurrentUser());

        if (!repo.existsById(id)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Semester test not found");
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
