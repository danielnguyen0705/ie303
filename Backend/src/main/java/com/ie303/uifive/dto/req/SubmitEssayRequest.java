package com.ie303.uifive.dto.req;

public record SubmitEssayRequest(
        Long questionId,
        String answerText
) {
}
