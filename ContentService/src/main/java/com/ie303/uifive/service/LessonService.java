package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.LessonRequest;
import com.ie303.uifive.dto.req.ReviewCreationRequest;
import com.ie303.uifive.dto.res.LessonResponse;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.Section;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.SectionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepo lessonRepo;
    private final SectionRepo sectionRepo;
    private final ContentDeletionService contentDeletionService;
    private final UserService userService;

    public LessonResponse create(LessonRequest request) {
        Lesson lesson = new Lesson();
        lesson.setLessonNumber(request.lessonNumber());
        lesson.setTitle(request.title());
        lesson.setSkillType(request.skillType());
        lesson.setReviewLesson(request.isReviewLesson());
        lesson.setDurationMinutes(request.durationMinutes());
        lesson.setVipOnly(request.isVipOnly());
        lesson.setOrderIndex(request.orderIndex());

        Section section = sectionRepo.findById(request.sectionId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));
        lesson.setSection(section);

        return toResponse(lessonRepo.save(lesson));
    }

    public LessonResponse getById(Long id) {
        Lesson lesson = findLesson(id);
        ensureLessonAccessible(lesson);
        return toResponse(lesson);
    }

    public List<LessonResponse> getAll() {
        User user = userService.getCurrentUser();
        boolean canSeeVipLessons = user.getRole() == Role.ADMIN || userService.hasVipAccess(user);

        return lessonRepo.findAll().stream()
                .filter(lesson -> canSeeVipLessons || !lesson.isVipOnly())
                .map(this::toResponse)
                .toList();
    }

    public LessonResponse update(Long id, LessonRequest request) {
        Lesson lesson = findLesson(id);
        lesson.setLessonNumber(request.lessonNumber());
        lesson.setTitle(request.title());
        lesson.setSkillType(request.skillType());
        lesson.setReviewLesson(request.isReviewLesson());
        lesson.setDurationMinutes(request.durationMinutes());
        lesson.setVipOnly(request.isVipOnly());
        lesson.setOrderIndex(request.orderIndex());

        Section section = sectionRepo.findById(request.sectionId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));
        lesson.setSection(section);

        return toResponse(lessonRepo.save(lesson));
    }

    @Transactional
    public void delete(Long id) {
        if (!lessonRepo.existsById(id)) {
            throw new AppException(ErrorCode.LESSON_NOT_FOUND);
        }
        contentDeletionService.deleteLesson(id);
    }

    public LessonResponse createReviewFromLesson(Long sourceLessonId, ReviewCreationRequest request) {
        Lesson source = findLesson(sourceLessonId);
        Lesson review = new Lesson();
        review.setLessonNumber(source.getLessonNumber());
        review.setTitle(request.title() != null ? request.title() : "Review: " + source.getTitle());
        review.setSkillType(source.getSkillType());
        review.setDurationMinutes(source.getDurationMinutes());
        review.setVipOnly(source.isVipOnly());
        review.setReviewLesson(true);
        review.setSection(source.getSection());
        review.setOrderIndex(lessonRepo.findBySectionId(source.getSection().getId()).size() + 1);

        return toResponse(lessonRepo.save(review));
    }

    private Lesson findLesson(Long id) {
        return lessonRepo.findById(id).orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));
    }

    private void ensureLessonAccessible(Lesson lesson) {
        User user = userService.getCurrentUser();
        if (user.getRole() != Role.ADMIN && lesson.isVipOnly() && !userService.hasVipAccess(user)) {
            throw new AppException(ErrorCode.VIP_REQUIRED);
        }
    }

    private LessonResponse toResponse(Lesson lesson) {
        return new LessonResponse(
                lesson.getId(),
                lesson.getLessonNumber(),
                lesson.getTitle(),
                lesson.getSkillType(),
                lesson.isReviewLesson(),
                lesson.getDurationMinutes(),
                lesson.isVipOnly(),
                lesson.getOrderIndex(),
                lesson.getSection() == null ? null : lesson.getSection().getId()
        );
    }
}
