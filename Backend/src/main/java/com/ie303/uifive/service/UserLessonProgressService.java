package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.res.UserLessonProgressResponse;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserLessonProgress;
import com.ie303.uifive.mapper.UserLessonProgressMapper;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.UserLessonProgressRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class UserLessonProgressService {

    private final UserLessonProgressRepo repo;
    private final UserRepo userRepo;
    private final LessonRepo lessonRepo;
    private final UserLessonProgressMapper mapper;

    public UserLessonProgressResponse submit(UserLessonProgressRequest request) {
        User user = userRepo.findById(request.userId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User với id = " + request.userId()));

        Lesson lesson = lessonRepo.findById(request.lessonId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Lesson với id = " + request.lessonId()));

        UserLessonProgress progress = repo.findByUserIdAndLessonId(request.userId(), request.lessonId())
                .orElseGet(() -> {
                    UserLessonProgress entity = mapper.toEntity(request);
                    entity.setUser(user);
                    entity.setLesson(lesson);
                    return entity;
                });

        mapper.updateEntityFromRequest(request, progress);
        progress.setUser(user);
        progress.setLesson(lesson);
        progress.setCompleted(true);

        int coinEarned = (int) (request.score() * 10);
        progress.setCoinsEarned(coinEarned);

        user.setCoin(user.getCoin() + coinEarned);

        LocalDate today = LocalDate.now();

        if (user.getLastStudyDate() == null) {
            user.setStreak(1);
        } else if (user.getLastStudyDate().plusDays(1).equals(today)) {
            user.setStreak(user.getStreak() + 1);
        } else if (!user.getLastStudyDate().equals(today)) {
            user.setStreak(1);
        }

        user.setLastStudyDate(today);
        user.setScore(user.getScore() + (int) request.score());

        userRepo.save(user);

        progress = repo.save(progress);

        UserLessonProgressResponse response = mapper.toResponse(progress);
        return response;
    }

    public UserLessonProgressResponse getById(Long id) {
        UserLessonProgress entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy UserLessonProgress với id = " + id));

        UserLessonProgressResponse response = mapper.toResponse(entity);
        return response;
    }
}