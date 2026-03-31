package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.QuestionGroupType;

public record QuestionGroupResponse(
        Long id,
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