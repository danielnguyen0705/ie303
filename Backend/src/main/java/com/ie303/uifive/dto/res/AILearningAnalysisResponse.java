package com.ie303.uifive.dto.res;

import java.time.LocalDateTime;

public record AILearningAnalysisResponse(
        Long id,
        String strongSkill,
        String weakSkill,
        String trendLabel,
        String weakTopic,
        String recommendation,
        LocalDateTime generatedAt
) {
}
