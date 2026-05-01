package com.ie303.uifive.dto.res;

public record SpeakingEvaluationResponse(
        double score,
        String feedback,
        String transcript,
        String audioUrl
) {
}
