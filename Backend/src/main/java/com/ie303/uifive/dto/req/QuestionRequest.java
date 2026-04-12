package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.QuestionType;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

public record QuestionRequest(
        @NotNull(message = "questionType không được để trống")
        QuestionType questionType,

        String content,
        String instruction,
        MultipartFile audioUrl,
        MultipartFile imageUrl,
        String questionData,
        String explanation,
        String correctAnswer,

        Long lessonId,
        Long questionGroupId
) {
}