package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.res.LessonProgressResponse;
import com.ie303.uifive.dto.res.SectionProgressResponse;
import com.ie303.uifive.dto.res.StudyingGradeResponse;
import com.ie303.uifive.dto.res.UnitProgressResponse;
import com.ie303.uifive.dto.res.UserLessonProgressResponse;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.Section;
import com.ie303.uifive.entity.Unit;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserLessonProgress;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.SectionRepo;
import com.ie303.uifive.repo.UnitRepo;
import com.ie303.uifive.repo.UserLessonProgressRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class LearningProgressService {

    private static final ZoneId ACTIVITY_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int LESSON_COMPLETION_COIN_REWARD = 18;
    private static final int LESSON_COMPLETION_EXP_REWARD = 36;
    private static final double LESSON_PASS_ACCURACY = 0.0;

    private final UserService userService;
    private final UserRepo userRepo;
    private final UnitRepo unitRepo;
    private final SectionRepo sectionRepo;
    private final LessonRepo lessonRepo;
    private final UserLessonProgressRepo userLessonProgressRepo;

    @CacheEvict(cacheNames = {
            "progress-grades-units",
            "progress-units-sections",
            "progress-sections-lessons",
            "leaderboard-coins",
            "leaderboard-collectors",
            "leaderboard-exp"
    }, allEntries = true)
    public UserLessonProgressResponse completeLesson(UserLessonProgressRequest request) {
        User currentUser = userService.getCurrentUser();
        User user = userRepo.findById(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        final User progressUser = user;

        Lesson lesson = lessonRepo.findById(request.lessonId())
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));
        final Lesson progressLesson = lesson;

        if (user.getRole() != Role.ADMIN && lesson.isVipOnly() && !userService.hasVipAccess(user)) {
            throw new AppException(ErrorCode.VIP_REQUIRED);
        }

        Long gradeId = lesson.getSection().getUnit().getGrade().getId();
        List<Lesson> allLessonsInGrade = lessonRepo.findAllByGradeIdOrder(gradeId);
        Set<Long> completedLessonIds = userLessonProgressRepo.findCompletedLessonIdsByUserAndGrade(user, gradeId);
        boolean alreadyCompleted = completedLessonIds.contains(lesson.getId());
        Long currentLessonId = resolveCurrentLessonId(allLessonsInGrade, completedLessonIds);

        if (user.getRole() != Role.ADMIN && !alreadyCompleted && currentLessonId != null && !currentLessonId.equals(lesson.getId())) {
            throw new AppException(ErrorCode.LESSON_LOCKED);
        }

        UserLessonProgress progress = userLessonProgressRepo
                .findByUserIdAndLessonId(progressUser.getId(), progressLesson.getId())
                .orElseGet(() -> {
                    UserLessonProgress created = new UserLessonProgress();
                    created.setUser(progressUser);
                    created.setLesson(progressLesson);
                    created.setCompleted(false);
                    created.setCoinsEarned(0);
                    return created;
                });

        boolean passedThisAttempt = request.accuracy() >= LESSON_PASS_ACCURACY;
        boolean wasCompletedBeforeAttempt = alreadyCompleted || progress.isCompleted();
        boolean completedAfterAttempt = wasCompletedBeforeAttempt || passedThisAttempt;
        boolean firstTimeCompletion = !wasCompletedBeforeAttempt && passedThisAttempt;

        progress.setScore(request.score());
        progress.setAccuracy(request.accuracy());
        progress.setCompleted(completedAfterAttempt);
        progress.setProgressPercent(Math.max(0.0, Math.min(100.0, request.accuracy())));
        LocalDateTime now = LocalDateTime.now(ACTIVITY_ZONE);
        progress.setLastAccessedAt(now);

        if (completedAfterAttempt && progress.getCompletedAt() == null) {
            progress.setCompletedAt(now);
        } else if (!completedAfterAttempt) {
            progress.setCompletedAt(null);
        }

        int expEarned = 0;
        if (firstTimeCompletion) {
            userService.touchStudyStreak(user.getId());
            user = userRepo.findById(user.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            user.setCoin(user.getCoin() + LESSON_COMPLETION_COIN_REWARD);
            expEarned = calculateLessonExpReward(user);
            user.setExp(user.getExp() + expEarned);
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

    @Cacheable(cacheNames = "progress-grades-units", key = "#root.target.currentUserCacheKey() + ':' + #gradeId")
    public List<UnitProgressResponse> getUnitsByGrade(Long gradeId) {
        User user = userService.getCurrentUser();
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean hasVipAccess = userService.hasVipAccess(user);

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

                    return new UnitProgressResponse(unit.getId(), unit.getTitle(), unit.getUnitNumber(), progressPercent);
                })
                .toList();
    }

    @Cacheable(cacheNames = "progress-units-sections", key = "#root.target.currentUserCacheKey() + ':' + #unitId")
    public List<SectionProgressResponse> getSectionsByUnit(Long unitId) {
        User user = userService.getCurrentUser();
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean hasVipAccess = userService.hasVipAccess(user);

        Unit unit = unitRepo.findById(unitId)
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_NOT_FOUND));

        List<Section> sections = sectionRepo.findByUnitIdOrderBySectionNumberAsc(unit.getId());
        Set<Long> completedLessonIds = userLessonProgressRepo.findCompletedLessonIdsByUserAndGrade(user, unit.getGrade().getId());

        return sections.stream().map(section -> {
            List<Lesson> sectionLessons = filterVisibleLessons(lessonRepo.findBySectionIdOrdered(section.getId()), isAdmin, hasVipAccess);
            long totalLessons = sectionLessons.size();
            long completedLessons = sectionLessons.stream()
                    .filter(lesson -> completedLessonIds.contains(lesson.getId()))
                    .count();

            double progressPercent = totalLessons == 0 ? 0 : (completedLessons * 100.0 / totalLessons);
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
        boolean hasVipAccess = userService.hasVipAccess(user);

        Section section = sectionRepo.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        Long gradeId = section.getUnit().getGrade().getId();
        List<Lesson> allLessonsInGrade = lessonRepo.findAllByGradeIdOrder(gradeId);
        Set<Long> completedLessonIds = userLessonProgressRepo.findCompletedLessonIdsByUserAndGrade(user, gradeId);
        List<Lesson> accessibleLessonsInGrade = filterVisibleLessons(allLessonsInGrade, isAdmin, hasVipAccess);
        Long currentLessonId = resolveCurrentLessonId(accessibleLessonsInGrade, completedLessonIds);

        List<Lesson> lessonsInSection = filterVisibleLessons(lessonRepo.findBySectionIdOrdered(sectionId), isAdmin, hasVipAccess);

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

    public List<LessonProgressResponse> getReviewLessonsBySection(Long sectionId) {
        return getLessonsBySection(sectionId).stream()
                .filter(LessonProgressResponse::reviewLesson)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudyingGradeResponse> getStudyingGradesByUsername(String username) {
        User user = userRepo.findByUsername(username);
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        return userLessonProgressRepo.findDistinctGradesByUser(user).stream()
                .sorted((left, right) -> Long.compare(left.getId(), right.getId()))
                .map(grade -> {
                    int totalLessons = userLessonProgressRepo.countTotalLessonsByGradeId(grade.getId());
                    int completedLessons = userLessonProgressRepo.countCompletedLessonsByUserAndGrade(user, grade.getId());

                    double progressPercent = totalLessons == 0
                            ? 0.0
                            : (completedLessons * 100.0 / totalLessons);

                    return new StudyingGradeResponse(grade.getId(), grade.getName(), progressPercent);
                })
                .toList();
    }

    public String currentUserCacheKey() {
        User user = userService.getCurrentUser();
        return user.getId() + ":" + user.getRole() + ":" + user.getVipExpiredAt();
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

    private List<Lesson> filterVisibleLessons(List<Lesson> lessons, boolean isAdmin, boolean hasVipAccess) {
        if (isAdmin || hasVipAccess) {
            return lessons;
        }

        return lessons.stream()
                .filter(lesson -> !lesson.isVipOnly())
                .toList();
    }

    private int calculateLessonExpReward(User user) {
        return LESSON_COMPLETION_EXP_REWARD;
    }
}
