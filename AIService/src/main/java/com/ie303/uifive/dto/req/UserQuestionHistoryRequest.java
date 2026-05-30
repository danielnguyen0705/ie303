package com.ie303.uifive.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public record UserQuestionHistoryRequest(
        @NotNull Long questionId,
        @JsonProperty("answer_text")
        String answerText
) {
}