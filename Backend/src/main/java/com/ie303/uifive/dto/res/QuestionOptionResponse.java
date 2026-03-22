package com.ie303.uifive.dto.res;

public record QuestionOptionResponse(
        Long id,
        String optionText,
        boolean correct,
        Long questionId
) {
}