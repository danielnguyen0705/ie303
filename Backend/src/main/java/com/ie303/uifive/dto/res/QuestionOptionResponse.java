package com.ie303.uifive.dto.res;

public record QuestionOptionResponse(
        Long id,
        String optionKey,
        String content,
        boolean isCorrect,
        Long questionId
) {
}