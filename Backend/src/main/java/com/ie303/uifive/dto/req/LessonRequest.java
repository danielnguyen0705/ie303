package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.LessonType;
import com.ie303.uifive.entity.SkillType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LessonRequest(
        @NotNull(message = "lessonNumber không được để trống")
        Integer lessonNumber,

        @NotBlank(message = "title không được để trống")
        String title,

        @NotNull(message = "lessonType không được để trống")
        LessonType lessonType,

        @NotNull(message = "skillType không được để trống")
        SkillType skillType,

        boolean isReviewLesson,

        @NotNull(message = "sectionId không được để trống")
        Long sectionId
) {
}