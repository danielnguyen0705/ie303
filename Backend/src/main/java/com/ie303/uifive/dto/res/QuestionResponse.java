package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.QuestionType;

public record QuestionResponse(
        Long id,
        QuestionType questionType,
        String content,
        String audioUrl,
        String imageUrl,
        String correctAnswer,
        String explanation,
        Long lessonId
) {
}