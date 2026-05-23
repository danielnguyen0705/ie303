package com.ie303.uifive.dto.res;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public record UserQuestionHistoryResponse(
        Long id,
        @JsonProperty("answer_text")
        String answerText,
        boolean correct,
        LocalDateTime answeredAt,
        Long userId,
        Long questionId
) {
}