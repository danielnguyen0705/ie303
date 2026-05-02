package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.SkillType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LessonRequest(

        @NotNull(message = "lessonNumber không được để trống")
        @Min(value = 1, message = "lessonNumber phải lớn hơn 0")
        Integer lessonNumber,

        @NotBlank(message = "title không được để trống")
        @Size(max = 255, message = "title không được vượt quá 255 ký tự")
        String title,

        @NotNull(message = "skillType không được để trống")
        SkillType skillType,

        boolean isReviewLesson,

        @NotNull(message = "durationMinutes không được để trống")
        @Min(value = 1, message = "durationMinutes phải lớn hơn 0")
        Integer durationMinutes,

        boolean isVipOnly,

        @NotNull(message = "orderIndex không được để trống")
        @Min(value = 1, message = "orderIndex phải lớn hơn 0")
        Integer orderIndex,

        @NotNull(message = "sectionId không được để trống")
        Long sectionId
) {
}