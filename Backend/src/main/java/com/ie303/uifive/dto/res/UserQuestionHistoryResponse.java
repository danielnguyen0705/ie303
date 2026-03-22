package com.ie303.uifive.dto.res;

import java.time.LocalDateTime;

public record UserQuestionHistoryResponse(
        Long id,
        String selectedAnswer,
        boolean correct,
        int attemptCount,
        LocalDateTime answeredAt,
        Long userId,
        Long questionId
) {
}