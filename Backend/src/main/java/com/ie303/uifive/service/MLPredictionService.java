package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.MLPredictionRequest;
import com.ie303.uifive.dto.res.MLPredictionResponse;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class MLPredictionService {

    private final UserRepo userRepo;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ml.api.url:http://localhost:8000/predict}")
    private String mlApiUrl;

    @Async
    public void predictAndUpdateUserSkills(Long userId) {
        try {
            User user = userRepo.findById(userId).orElse(null);
            if (user == null) return;

            // Build request with dummy data for non-existing fields, 
            // or fetch real statistics if available in your system.
            // For now, mapping existing user fields and defaulting others.
            MLPredictionRequest request = MLPredictionRequest.builder()
                    .role(user.getRole() != null ? user.getRole().name() : "USER")
                    .coin(user.getCoin())
                    .score(user.getScore())
                    .streak(user.getStreak())
                    .days_since_last_study(0) // Defaulted, should be calculated from lastStudyDate
                    .vip_days_remaining(0)
                    .is_vip_active(0)
                    .grade_id(1L) // Defaulted
                    .unit_progress_percent(100.0)
                    .section_progress_percent(100.0)
                    .active_days_7d(user.getStreak())
                    .active_days_14d(user.getStreak())
                    .active_days_30d(user.getStreak())
                    .lessons_completed_7d(5)
                    .lessons_completed_14d(10)
                    .lessons_completed_30d(20)
                    .questions_answered_7d(50)
                    .questions_answered_14d(100)
                    .questions_answered_30d(200)
                    .accuracy_7d(75.0)
                    .accuracy_14d(75.0)
                    .accuracy_30d(75.0)
                    .avg_attempt_count_7d(1.5)
                    .coins_earned_7d(user.getCoin())
                    .coins_earned_30d(user.getCoin())
                    .writing_eval_count_30d(2)
                    .speaking_eval_count_30d(2)
                    .avg_writing_ai_score_30d(70.0)
                    .avg_speaking_ai_score_30d(70.0)
                    .skip_item_quantity(0)
                    .listening_accuracy_30d(75.0)
                    .speaking_accuracy_30d(75.0)
                    .reading_accuracy_30d(75.0)
                    .writing_accuracy_30d(75.0)
                    .vocabulary_accuracy_30d(75.0)
                    .grammar_accuracy_30d(75.0)
                    .build();

            MLPredictionResponse response = restTemplate.postForObject(mlApiUrl, request, MLPredictionResponse.class);

            if (response != null) {
                user.setStrongSkill(response.getStrongSkill());
                user.setWeakSkill(response.getWeakSkill());
                user.setTrendLabel(response.getTrendLabel());
                userRepo.save(user);
                log.info("Updated ML predictions for User {}: Strong={}, Weak={}, Trend={}", 
                        userId, response.getStrongSkill(), response.getWeakSkill(), response.getTrendLabel());
            }
        } catch (Exception e) {
            log.error("Failed to predict and update user skills for User {}: {}", userId, e.getMessage());
        }
    }
}
