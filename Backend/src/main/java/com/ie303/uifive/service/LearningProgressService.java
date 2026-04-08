package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.res.UserLessonProgressResponse;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserLessonProgress;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.UserLessonProgressMapper;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.UserLessonProgressRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class UserLessonProgressService {

    private final UserLessonProgressRepo repo;
    private final UserRepo userRepo;
    private final LessonRepo lessonRepo;
    private final UserLessonProgressMapper mapper;
    private final UserLessonProgressRepo progressRepo;

    public UserLessonProgressResponse submitLessonResult(String username, UserLessonProgressRequest request) {
        User user = userRepo.findByUsername(username);
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        Lesson lesson = lessonRepo.findById(request.lessonId())
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        UserLessonProgress progress = progressRepo
                .findByUserIdAndLessonId(user.getId(), lesson.getId())
                .orElseGet(() -> {
                    UserLessonProgress newProgress = new UserLessonProgress();
                    newProgress.setUser(user);
                    newProgress.setLesson(lesson);
                    newProgress.setCoinsEarned(0);
                    return newProgress;
                });

        progress.setScore(request.score());
        progress.setAccuracy(request.accuracy());
        progress.setCompleted(true);
        progress.setProgressPercent(100);
        progress.setLastAccessedAt(LocalDateTime.now());

        if (progress.getCompletedAt() == null) {
            progress.setCompletedAt(LocalDateTime.now());
        }

        progress.setCoinsEarned(calculateCoins(request.score()));
        user.setCoin(user.getCoin() + progress.getCoinsEarned());

        UserLessonProgress saved = progressRepo.save(progress);
        return mapper.toResponse(saved);
    }

    private int calculateCoins(double score) {
        if (score >= 90) return 10;
        if (score >= 75) return 7;
        if (score >= 50) return 5;
        return 2;
    }

    public UserLessonProgressResponse getById(Long id) {
        UserLessonProgress entity = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        return mapper.toResponse(entity);
    }
}