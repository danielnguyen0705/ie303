package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.GroupReviewRequest;
import com.ie303.uifive.dto.res.GroupReviewResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.GroupReview;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.GroupReviewMapper;
import com.ie303.uifive.repo.GradeRepo;
import com.ie303.uifive.repo.GroupReviewRepo;
import com.ie303.uifive.repo.QuestionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupReviewService {

    private final GroupReviewRepo groupReviewRepo;
    private final GradeRepo gradeRepo;
    private final QuestionRepo questionRepo;
    private final GroupReviewMapper mapper;
    private final UserService userService;

    public GroupReviewResponse create(GroupReviewRequest request) {
        ensureVip(userService.getCurrentUser());

        validateUnitRange(request.startUnit(), request.endUnit());

        GroupReview entity = mapper.toEntity(request);

        if (request.gradeId() != null) {
            Grade grade = gradeRepo.findById(request.gradeId())
                    .orElseThrow(() -> new AppException(ErrorCode.GRADE_NOT_FOUND));
            entity.setGrade(grade);
        }

        if (request.questionIds() != null && !request.questionIds().isEmpty()) {
            List<Question> questions = questionRepo.findAllById(request.questionIds());
            entity.setQuestions(questions);
        }

        entity = groupReviewRepo.save(entity);

        GroupReviewResponse response = mapper.toResponse(entity);
        return response;
    }

    public GroupReviewResponse getById(Long id) {
        ensureVip(userService.getCurrentUser());

        GroupReview entity = groupReviewRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Group review not found"));

        GroupReviewResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<GroupReviewResponse> getAll() {
        ensureVip(userService.getCurrentUser());

        List<GroupReview> entities = groupReviewRepo.findAll();

        List<GroupReviewResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public GroupReviewResponse update(Long id, GroupReviewRequest request) {
        ensureVip(userService.getCurrentUser());

        validateUnitRange(request.startUnit(), request.endUnit());

        GroupReview entity = groupReviewRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Group review not found"));

        mapper.updateEntityFromRequest(request, entity);

        if (request.gradeId() != null) {
            Grade grade = gradeRepo.findById(request.gradeId())
                    .orElseThrow(() -> new AppException(ErrorCode.GRADE_NOT_FOUND));
            entity.setGrade(grade);
        } else {
            entity.setGrade(null);
        }

        if (request.questionIds() != null && !request.questionIds().isEmpty()) {
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
        ensureVip(userService.getCurrentUser());

        if (!groupReviewRepo.existsById(id)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Group review not found");
        }

        groupReviewRepo.deleteById(id);
    }

    private void ensureVip(User user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (user.getVipExpiredAt() == null || !user.getVipExpiredAt().isAfter(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VIP_REQUIRED);
        }
    }

    private void validateUnitRange(int startUnit, int endUnit) {
        if (startUnit > endUnit) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "startUnit must be <= endUnit");
        }
    }

}
