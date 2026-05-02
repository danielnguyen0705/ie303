package com.ie303.uifive.service;

import com.ie303.uifive.dto.res.AILearningAnalysisResponse;
import com.ie303.uifive.dto.res.MLPredictionResponse;
import com.ie303.uifive.entity.AILearningAnalysis;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.repo.AILearningAnalysisRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LearningAnalysisService {

    private final AILearningAnalysisRepo analysisRepo;
    private final UserRepo userRepo;

    @Transactional
    public void saveAnalysis(User user, MLPredictionResponse response) {
        if (user == null || response == null) {
            return;
        }

        User managedUser = userRepo.findById(user.getId()).orElse(null);
        if (managedUser == null) {
            return;
        }

        AILearningAnalysis analysis = new AILearningAnalysis();
        analysis.setUser(managedUser);
        analysis.setStrongSkill(response.getStrongSkill());
        analysis.setWeakSkill(response.getWeakSkill());
        analysis.setTrendLabel(response.getTrendLabel());
        analysis.setWeakTopic(resolveWeakTopic(response.getWeakSkill()));
        analysis.setRecommendation(buildRecommendation(response.getWeakSkill(), response.getTrendLabel()));

        analysisRepo.save(analysis);
    }

    @Transactional(readOnly = true)
    public AILearningAnalysisResponse getLatestByUsername(String username) {
        User user = userRepo.findByUsername(username);
        if (user == null) {
            return null;
        }

        return analysisRepo.findTopByUserOrderByGeneratedAtDesc(user)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<AILearningAnalysisResponse> getHistoryByUsername(String username) {
        User user = userRepo.findByUsername(username);
        if (user == null) {
            return List.of();
        }

        return analysisRepo.findByUserOrderByGeneratedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AILearningAnalysisResponse toResponse(AILearningAnalysis analysis) {
        return new AILearningAnalysisResponse(
                analysis.getId(),
                analysis.getStrongSkill(),
                analysis.getWeakSkill(),
                analysis.getTrendLabel(),
                analysis.getWeakTopic(),
                analysis.getRecommendation(),
                analysis.getGeneratedAt()
        );
    }

    private String resolveWeakTopic(String weakSkill) {
        if (weakSkill == null || weakSkill.isBlank()) {
            return "general";
        }

        return weakSkill.trim();
    }

    private String buildRecommendation(String weakSkill, String trendLabel) {
        String normalizedSkill = weakSkill == null ? "general" : weakSkill.trim().toLowerCase();
        String trendText = trendLabel == null ? "stable" : trendLabel.trim().toLowerCase();

        String recommendation = switch (normalizedSkill) {
            case "listening" -> "Practice short listening drills every day and replay difficult sections.";
            case "speaking" -> "Record your speaking answers, compare pronunciation, and repeat key phrases.";
            case "reading" -> "Read one passage daily and highlight unknown words or patterns.";
            case "writing" -> "Write a short paragraph daily and review grammar mistakes carefully.";
            case "vocabulary" -> "Review 10 new words daily with spaced repetition and example sentences.";
            case "grammar" -> "Focus on one grammar rule at a time and do targeted exercises.";
            default -> "Keep practicing consistently and review the weakest area after each study session.";
        };

        if ("declining".equals(trendText)) {
            return recommendation + " Your trend is declining, so reduce gaps between study sessions.";
        }

        if ("improving".equals(trendText)) {
            return recommendation + " Your trend is improving, so keep the current pace.";
        }

        return recommendation;
    }
}
