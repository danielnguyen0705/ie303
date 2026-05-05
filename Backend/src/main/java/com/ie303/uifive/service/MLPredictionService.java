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
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class MLPredictionService {

    private final UserRepo userRepo;
    private final RestTemplate restTemplate;
    private final StudentFeatureService studentFeatureService;
    private final LearningAnalysisService learningAnalysisService;

    @Value("${ml.api.url:http://localhost:8000/predict}")
    private String mlApiUrl;

    @Async
    public void predictAndUpdateUserSkills(Long userId) {
        try {
            User user = userRepo.findById(userId).orElse(null);
            if (user == null) return;

            MLPredictionRequest request = studentFeatureService.buildPredictionRequest(user);
            MLPredictionResponse response = restTemplate.postForObject(mlApiUrl, request, MLPredictionResponse.class);

            if (response != null) {
                user.setStrongSkill(response.getStrongSkill());
                user.setWeakSkill(response.getWeakSkill());
                user.setTrendLabel(response.getTrendLabel());
                userRepo.save(user);
                learningAnalysisService.saveAnalysis(user, response);
                log.info("Updated ML predictions for User {}: Strong={}, Weak={}, Trend={}", 
                        userId, response.getStrongSkill(), response.getWeakSkill(), response.getTrendLabel());
            }
        } catch (RestClientException e) {
            log.error("ML service request failed for User {} at {}: {}", userId, mlApiUrl, e.getMessage());
        } catch (Exception e) {
            log.error("Failed to predict and update user skills for User {}: {}", userId, e.getMessage());
        }
    }
}
