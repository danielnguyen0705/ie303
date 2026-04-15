package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.res.LessonProgressResponse;
import com.ie303.uifive.dto.res.SectionProgressResponse;
import com.ie303.uifive.dto.res.UnitProgressResponse;
import com.ie303.uifive.dto.res.UserLessonProgressResponse;
import com.ie303.uifive.entity.*;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.UserLessonProgressMapper;
import com.ie303.uifive.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class LearningProgressService {

    private static final int LESSON_COMPLETION_COIN_REWARD = 10;
    private static final int LESSON_COMPLETION_EXP_REWARD = 20;

    private final UserService userService;
    private final UserRepo userRepo;
    private final UnitRepo unitRepo;
    private final SectionRepo sectionRepo;
    private final LessonRepo lessonRepo;
    private final UserLessonProgressRepo userLessonProgressRepo;
    private final UserLessonProgressMapper userLessonProgressMapper;

    public UserLessonProgressResponse completeLesson(UserLessonProgressRequest request) {
        User user = userService.getCurrentUser();
        int expEarned = 0;

        Lesson lesson = lessonRepo.findById(request.lessonId())
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        Long gradeId = lesson.getSection().getUnit().getGrade().getId();
        List<Lesson> allLessonsInGrade = lessonRepo.findAllByGradeIdOrder(gradeId);
        Set<Long> completedLessonIds = userLessonProgressRepo.findCompletedLessonIdsByUserAndGrade(user, gradeId);

        boolean alreadyCompleted = completedLessonIds.contains(lesson.getId());
        Long currentLessonId = resolveCurrentLessonId(allLessonsInGrade, completedLessonIds);

        if (!alreadyCompleted && currentLessonId != null && !currentLessonId.equals(lesson.getId())) {
            throw new AppException(ErrorCode.LESSON_LOCKED);
        }

        UserLessonProgress progress = userLessonProgressRepo
                .findByUserIdAndLessonId(user.getId(), lesson.getId())
                .orElseGet(() -> {
                    UserLessonProgress created = userLessonProgressMapper.toEntity(request);
                    created.setUser(user);
                    created.setLesson(lesson);
                    created.setCompleted(false);
                    created.setCoinsEarned(0);
                    return created;
                });

        userLessonProgressMapper.updateEntityFromRequest(request, progress);
        progress.setUser(user);
        progress.setLesson(lesson);
        progress.setCompleted(true);
        progress.setProgressPercent(100.0);
        progress.setLastAccessedAt(LocalDateTime.now());

        if (progress.getCompletedAt() == null) {
            progress.setCompletedAt(LocalDateTime.now());
        }

        if (!alreadyCompleted) {
            user.setCoin(user.getCoin() + LESSON_COMPLETION_COIN_REWARD);
            user.setExp(user.getExp() + LESSON_COMPLETION_EXP_REWARD);
            expEarned = LESSON_COMPLETION_EXP_REWARD;
            progress.setCoinsEarned(LESSON_COMPLETION_COIN_REWARD);
            userRepo.save(user);
        }

        UserLessonProgress saved = userLessonProgressRepo.save(progress);
        return new UserLessonProgressResponse(
                saved.getId(),
                saved.isCompleted(),
                saved.getScore(),
                saved.getAccuracy(),
                saved.getProgressPercent(),
                saved.getCoinsEarned(),
                expEarned,
                user.getExp(),
                saved.getLastAccessedAt(),
                saved.getCompletedAt(),
                saved.getUser().getId(),
                saved.getLesson().getId()
        );
    }

    public List<UnitProgressResponse> getUnitsByGrade(Long gradeId) {
        User user = userService.getCurrentUser();

        List<Unit> units = unitRepo.findByGradeIdOrderByUnitNumberAsc(gradeId);

        return units.stream()
                .map(unit -> {
                    int totalLessons = lessonRepo.countLessonsByUnitId(unit.getId());
                    int completedLessons = userLessonProgressRepo
                            .countCompletedLessonsByUserAndUnit(user, unit.getId());

                    double progressPercent = 0.0;
                    if (totalLessons > 0) {
                        progressPercent = (completedLessons * 100.0) / totalLessons;
                    }

                    return new UnitProgressResponse(
                            unit.getId(),
                            unit.getTitle(),
                            unit.getUnitNumber(),
                            progressPercent
                    );
                })
                .toList();
    }

    public List<SectionProgressResponse> getSectionsByUnit(Long unitId) {
        User user = userService.getCurrentUser();

        Unit unit = unitRepo.findById(unitId)
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_NOT_FOUND));

        List<Section> sections = sectionRepo.findByUnitIdOrderBySectionNumberAsc(unit.getId());

        return sections.stream().map(section -> {
            int totalLessons = lessonRepo.countLessonsBySectionId(section.getId());
            int completedLessons = userLessonProgressRepo.countCompletedLessonsByUserAndSection(user, section.getId());

            double progressPercent = totalLessons == 0
                    ? 0
                    : (completedLessons * 100.0 / totalLessons);

            return new SectionProgressResponse(section.getId(), section.getTitle(), section.getSectionNumber(), progressPercent);
        }).toList();
    }

    public List<LessonProgressResponse> getLessonsBySection(Long sectionId) {
        User user = userService.getCurrentUser();

        Section section = sectionRepo.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        Long gradeId = section.getUnit().getGrade().getId();

        List<Lesson> allLessonsInGrade = lessonRepo.findAllByGradeIdOrder(gradeId);
        Set<Long> completedLessonIds = userLessonProgressRepo.findCompletedLessonIdsByUserAndGrade(user, gradeId);
        Long currentLessonId = resolveCurrentLessonId(allLessonsInGrade, completedLessonIds);

        List<Lesson> lessonsInSection = lessonRepo.findBySectionIdOrderByLessonNumberAsc(sectionId);

        return lessonsInSection.stream().map(lesson -> {
            boolean completed = completedLessonIds.contains(lesson.getId());
            boolean current = currentLessonId != null && currentLessonId.equals(lesson.getId());
            boolean unlocked = completed || current;
            return new LessonProgressResponse(lesson.getId(), lesson.getTitle(), lesson.getLessonNumber(), completed, unlocked, current);
        }).toList();
    }

    private Long resolveCurrentLessonId(List<Lesson> allLessonsInGrade, Set<Long> completedLessonIds) {
        for (Lesson lesson : allLessonsInGrade) {
            if (!completedLessonIds.contains(lesson.getId())) {
                return lesson.getId();
            }
        }

        return allLessonsInGrade.isEmpty()
                ? null
                : allLessonsInGrade.get(allLessonsInGrade.size() - 1).getId();
    }
}