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
import com.ie303.uifive.mapper.LessonMapper;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.SectionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepo lessonRepo;
    private final SectionRepo sectionRepo;
    private final LessonMapper lessonMapper;
    private final ContentDeletionService contentDeletionService;
    private final QuestionRepo questionRepo;
    private final UserService userService;

    public String currentUserCacheKey() {
        User user = userService.getCurrentUser();
        return user.getId() + ":" + user.getRole() + ":" + user.getVipExpiredAt();
    }

    @CacheEvict(cacheNames = {
            "lessons",
            "questions-by-id",
            "question-groups-by-id",
            "questions-by-lesson",
            "progress-grades-units",
            "progress-units-sections",
            "progress-sections-lessons"
    }, allEntries = true)
    public LessonResponse create(LessonRequest request) {
        Lesson lesson = lessonMapper.toEntity(request);

        Section section = sectionRepo.findById(request.sectionId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        lesson.setSection(section);

        lesson = lessonRepo.save(lesson);

        // Attach questions to lesson if provided (useful for review lessons)
        if (request.questionIds() != null && !request.questionIds().isEmpty()) {
            List<Question> questions = questionRepo.findAllById(request.questionIds());
            for (Question q : questions) {
                q.setLesson(lesson);
            }
            questionRepo.saveAll(questions);
        }

        LessonResponse response = lessonMapper.toResponse(lesson);
        return response;
    }

    @Cacheable(cacheNames = "lessons", key = "#root.target.currentUserCacheKey() + ':' + #id")
    public LessonResponse getById(Long id) {
        Lesson lesson = lessonRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        ensureLessonAccessible(lesson);

        LessonResponse response = lessonMapper.toResponse(lesson);
        return response;
    }

    @Cacheable(cacheNames = "lessons", key = "#root.target.currentUserCacheKey() + ':all'")
    public List<LessonResponse> getAll() {
        List<Lesson> lessons = lessonRepo.findAll();
        User user = userService.getCurrentUser();
        boolean canSeeVipLessons = user.getRole() == Role.ADMIN || hasVipAccess(user);

        List<LessonResponse> responses = lessons.stream()
                .filter(lesson -> canSeeVipLessons || !lesson.isVipOnly())
                .map(lessonMapper::toResponse)
                .toList();

        return responses;
    }

    @CacheEvict(cacheNames = {
            "lessons",
            "questions-by-id",
            "question-groups-by-id",
            "questions-by-lesson",
            "progress-grades-units",
            "progress-units-sections",
            "progress-sections-lessons"
    }, allEntries = true)
    public LessonResponse update(Long id, LessonRequest request) {
        Lesson lesson = lessonRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        lessonMapper.updateEntityFromRequest(request, lesson);

        Section section = sectionRepo.findById(request.sectionId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        lesson.setSection(section);

        lesson = lessonRepo.save(lesson);

        // Update questions association when provided
        if (request.questionIds() != null) {
            // detach existing questions currently assigned to this lesson that are not in the new set
            List<Question> currently = questionRepo.findByLessonId(lesson.getId());
            List<Long> keepIds = request.questionIds();
            for (Question q : currently) {
                if (!keepIds.contains(q.getId())) {
                    q.setLesson(null);
                }
            }
            questionRepo.saveAll(currently);

            if (!keepIds.isEmpty()) {
                List<Question> newQuestions = questionRepo.findAllById(keepIds);
                for (Question q : newQuestions) {
                    q.setLesson(lesson);
                }
                questionRepo.saveAll(newQuestions);
            }
        }

        LessonResponse response = lessonMapper.toResponse(lesson);
        return response;
    }

    @Transactional
    @CacheEvict(cacheNames = {
            "lessons",
            "questions-by-id",
            "question-groups-by-id",
            "questions-by-lesson",
            "progress-grades-units",
            "progress-units-sections",
            "progress-sections-lessons"
    }, allEntries = true)
    public void delete(Long id) {
        if (!lessonRepo.existsById(id)) {
            throw new AppException(ErrorCode.LESSON_NOT_FOUND);
        }

        contentDeletionService.deleteLesson(id);
    }

    /**
     * Create a review lesson in the same section as the source lesson.
     * If questionIds provided in request, attach those questions to the new review lesson.
     */
    @Transactional
    public LessonResponse createReviewFromLesson(Long sourceLessonId, ReviewCreationRequest request) {
        Lesson source = lessonRepo.findById(sourceLessonId)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        Lesson review = new Lesson();
        review.setTitle(request.title() != null ? request.title() : "Review: " + source.getTitle());
        review.setLessonNumber(source.getLessonNumber());
        review.setSkillType(source.getSkillType());
        review.setDurationMinutes(source.getDurationMinutes());
        review.setVipOnly(source.isVipOnly());
        review.setReviewLesson(true);
        review.setSection(source.getSection());
        review.setOrderIndex(lessonRepo.countLessonsBySectionId(source.getSection().getId()) + 1);

        review = lessonRepo.save(review);

        if (request.questionIds() != null && !request.questionIds().isEmpty()) {
            List<Question> questions = questionRepo.findAllById(request.questionIds());
            for (Question q : questions) {
                q.setLesson(review);
            }
            questionRepo.saveAll(questions);
        }

        return lessonMapper.toResponse(review);
    }

    private void ensureLessonAccessible(Lesson lesson) {
        User user = userService.getCurrentUser();

        if (user.getRole() != Role.ADMIN && lesson.isVipOnly() && !hasVipAccess(user)) {
            throw new AppException(ErrorCode.VIP_REQUIRED);
        }
    }

    private boolean hasVipAccess(User user) {
        return user.getVipExpiredAt() != null && user.getVipExpiredAt().isAfter(LocalDateTime.now());
    }
}
