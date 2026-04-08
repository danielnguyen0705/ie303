package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.QuestionGroupType;
import jakarta.validation.constraints.NotNull;

public record QuestionGroupRequest(
        @NotNull(message = "groupType không được để trống")
        QuestionGroupType groupType,

        String title,
        String instruction,
        String sharedContent,
        String audioUrl,
        String imageUrl,
        String groupData,

        Long lessonId
) {
}