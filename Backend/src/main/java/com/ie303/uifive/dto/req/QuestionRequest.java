package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.QuestionType;
import jakarta.validation.constraints.NotNull;

public record QuestionRequest(
        @NotNull(message = "questionType không được để trống")
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