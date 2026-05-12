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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class LearningProgressService {

    private static final int LESSON_COMPLETION_COIN_REWARD = 18;
    private static final int LESSON_COMPLETION_EXP_REWARD = 36;
    private static final double LESSON_PASS_ACCURACY = 0.0;

    private final UserService userService;
    private final UserRepo userRepo;
    private final UnitRepo unitRepo;
    private final SectionRepo sectionRepo;
    private final LessonRepo lessonRepo;
    private final UserLessonProgressRepo userLessonProgressRepo;
    private final UserLessonProgressMapper userLessonProgressMapper;
    private final MLPredictionService mlPredictionService;

    public String currentUserCacheKey() {
        User user = userService.getCurrentUser();
        return user.getId() + ":" + user.getRole() + ":" + user.getVipExpiredAt();
    }

    @CacheEvict(cacheNames = {
            "progress-grades-units",
            "progress-units-sections",
            "progress-sections-lessons"
    }, allEntries = true)
    public UserLessonProgressResponse completeLesson(UserLessonProgressRequest request) {
        User currentUser = userService.getCurrentUser();
        User user = currentUser;
        int expEarned = 0;
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean hasVipAccess = hasVipAccess(currentUser);

        Lesson lesson = lessonRepo.findById(request.lessonId())
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        if (!isAdmin && lesson.isVipOnly() && !hasVipAccess) {
            throw new AppException(ErrorCode.VIP_REQUIRED);
        }

        Long gradeId = lesson.getSection().getUnit().getGrade().getId();
        List<Lesson> allLessonsInGrade = lessonRepo.findAllByGradeIdOrder(gradeId);
        Set<Long> completedLessonIds = userLessonProgressRepo.findCompletedLessonIdsByUserAndGrade(currentUser, gradeId);
        List<Lesson> accessibleLessonsInGrade = filterVisibleLessons(allLessonsInGrade, isAdmin, hasVipAccess);

        boolean alreadyCompleted = completedLessonIds.contains(lesson.getId());
        Long currentLessonId = resolveCurrentLessonId(accessibleLessonsInGrade, completedLessonIds);

        if (!isAdmin && !alreadyCompleted && currentLessonId != null && !currentLessonId.equals(lesson.getId())) {
            throw new AppException(ErrorCode.LESSON_LOCKED);
        }

        UserLessonProgress progress = userLessonProgressRepo
                .findByUserIdAndLessonId(currentUser.getId(), lesson.getId())
                .orElseGet(() -> {
                    UserLessonProgress created = userLessonProgressMapper.toEntity(request);
                    created.setUser(currentUser);
                    created.setLesson(lesson);
                    created.setCompleted(false);
                    created.setCoinsEarned(0);
                    return created;
                });

        userLessonProgressMapper.updateEntityFromRequest(request, progress);
        progress.setUser(currentUser);
        progress.setLesson(lesson);
        boolean passedThisAttempt = request.accuracy() >= LESSON_PASS_ACCURACY;
        boolean wasCompletedBeforeAttempt = alreadyCompleted || progress.isCompleted();
        boolean completedAfterAttempt = wasCompletedBeforeAttempt || passedThisAttempt;
        boolean firstTimeCompletion = !wasCompletedBeforeAttempt && passedThisAttempt;

        // Keep lessons permanently completed once a user has passed them.
        progress.setCompleted(completedAfterAttempt);
        progress.setProgressPercent(Math.max(0.0, Math.min(100.0, request.accuracy())));
        progress.setLastAccessedAt(LocalDateTime.now());

        if (completedAfterAttempt && progress.getCompletedAt() == null) {
            progress.setCompletedAt(LocalDateTime.now());
        } else if (!completedAfterAttempt) {
            progress.setCompletedAt(null);
        }

        if (firstTimeCompletion) {
            userService.touchStudyStreak(user.getId());
            user = userRepo.findById(user.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            user.setCoin(user.getCoin() + LESSON_COMPLETION_COIN_REWARD);
            expEarned = calculateLessonExpReward(user);
            user.setExp(user.getExp() + expEarned);
            progress.setCoinsEarned(LESSON_COMPLETION_COIN_REWARD);
            userRepo.save(user);

            // Call ML Prediction to update user strong/weak skills & trends
            mlPredictionService.predictAndUpdateUserSkills(user.getId());
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

    @Cacheable(cacheNames = "progress-grades-units", key = "#root.target.currentUserCacheKey() + ':' + #gradeId")
    public List<UnitProgressResponse> getUnitsByGrade(Long gradeId) {
        User user = userService.getCurrentUser();
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean hasVipAccess = hasVipAccess(user);

        List<Unit> units = unitRepo.findByGradeIdOrderByUnitNumberAsc(gradeId);
        List<Lesson> allLessonsInGrade = lessonRepo.findAllByGradeIdOrder(gradeId);
        List<Lesson> accessibleLessonsInGrade = filterVisibleLessons(allLessonsInGrade, isAdmin, hasVipAccess);
        Set<Long> completedLessonIds = userLessonProgressRepo.findCompletedLessonIdsByUserAndGrade(user, gradeId);

        return units.stream()
                .map(unit -> {
                    long totalLessons = accessibleLessonsInGrade.stream()
                            .filter(lesson -> lesson.getSection().getUnit().getId().equals(unit.getId()))
                            .count();
                    long completedLessons = accessibleLessonsInGrade.stream()
                            .filter(lesson -> lesson.getSection().getUnit().getId().equals(unit.getId()))
                            .filter(lesson -> completedLessonIds.contains(lesson.getId()))
                            .count();

                    double progressPercent = 0.0;
                    if (isAdmin) {
                        progressPercent = 100.0;
                    } else if (totalLessons > 0) {
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

    @Cacheable(cacheNames = "progress-units-sections", key = "#root.target.currentUserCacheKey() + ':' + #unitId")
    public List<SectionProgressResponse> getSectionsByUnit(Long unitId) {
        User user = userService.getCurrentUser();
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean hasVipAccess = hasVipAccess(user);

        Unit unit = unitRepo.findById(unitId)
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_NOT_FOUND));

        List<Section> sections = sectionRepo.findByUnitIdOrderBySectionNumberAsc(unit.getId());
        Set<Long> completedLessonIds = userLessonProgressRepo.findCompletedLessonIdsByUserAndGrade(user, unit.getGrade().getId());

        return sections.stream().map(section -> {
            List<Lesson> sectionLessons = filterVisibleLessons(
                    lessonRepo.findBySectionIdOrdered(section.getId()),
                    isAdmin,
                    hasVipAccess
            );
            long totalLessons = sectionLessons.size();
            long completedLessons = sectionLessons.stream()
                    .filter(lesson -> completedLessonIds.contains(lesson.getId()))
                    .count();

            double progressPercent = totalLessons == 0
                    ? 0
                    : (completedLessons * 100.0 / totalLessons);

            if (isAdmin) {
                progressPercent = 100.0;
            }

            return new SectionProgressResponse(section.getId(), section.getTitle(), section.getSectionNumber(), progressPercent);
        }).toList();
    }

    @Cacheable(cacheNames = "progress-sections-lessons", key = "#root.target.currentUserCacheKey() + ':' + #sectionId")
    public List<LessonProgressResponse> getLessonsBySection(Long sectionId) {
        User user = userService.getCurrentUser();
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean hasVipAccess = hasVipAccess(user);

        Section section = sectionRepo.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        Long gradeId = section.getUnit().getGrade().getId();

        List<Lesson> allLessonsInGrade = lessonRepo.findAllByGradeIdOrder(gradeId);
        Set<Long> completedLessonIds = userLessonProgressRepo.findCompletedLessonIdsByUserAndGrade(user, gradeId);
        List<Lesson> accessibleLessonsInGrade = filterVisibleLessons(allLessonsInGrade, isAdmin, hasVipAccess);
        Long currentLessonId = resolveCurrentLessonId(accessibleLessonsInGrade, completedLessonIds);

        List<Lesson> lessonsInSection = filterVisibleLessons(
                lessonRepo.findBySectionIdOrdered(sectionId),
                isAdmin,
                hasVipAccess
        );

        return lessonsInSection.stream().map(lesson -> {
            boolean completed = completedLessonIds.contains(lesson.getId());
            boolean current = currentLessonId != null && currentLessonId.equals(lesson.getId());
            boolean unlocked = isAdmin || completed || current;
            return new LessonProgressResponse(
                    lesson.getId(),
                    lesson.getTitle(),
                    lesson.getLessonNumber(),
                    lesson.getOrderIndex(),
                    lesson.isReviewLesson(),
                    lesson.isVipOnly(),
                    completed,
                    unlocked,
                    current
            );
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

    private boolean hasVipAccess(User user) {
        return user.getVipExpiredAt() != null && user.getVipExpiredAt().isAfter(LocalDateTime.now());
    }

    private List<Lesson> filterVisibleLessons(List<Lesson> lessons, boolean isAdmin, boolean hasVipAccess) {
        if (isAdmin || hasVipAccess) {
            return lessons;
        }

        return lessons.stream()
                .filter(lesson -> !lesson.isVipOnly())
                .toList();
    }

    public List<LessonProgressResponse> getReviewLessonsBySection(Long sectionId) {
        return getLessonsBySection(sectionId).stream()
                .filter(LessonProgressResponse::reviewLesson)
                .toList();
    }

    private int calculateLessonExpReward(User user) {
        double multiplier = resolveActiveExpMultiplier(user);
        return (int) Math.round(LESSON_COMPLETION_EXP_REWARD * multiplier);
    }

    private double resolveActiveExpMultiplier(User user) {
        LocalDateTime now = LocalDateTime.now();

        if (user.getExpBoostExpiredAt() == null || !user.getExpBoostExpiredAt().isAfter(now)) {
            return 1.0;
        }

        return Math.max(1.0, user.getExpBoostMultiplier());
    }
}
