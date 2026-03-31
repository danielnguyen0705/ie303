package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.QuestionType;

public record QuestionResponse(
        Long id,
        QuestionType questionType,
        String content,
        String instruction,
        String audioUrl,
        String imageUrl,
        String questionData,
        String explanation,
        Long lessonId,
        Long questionGroupId
) {
}