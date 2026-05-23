package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.QuestionGroupType;

import java.util.List;

public record QuestionGroupResponse(
        Long id,
        QuestionGroupType groupType,
        String title,
        String instruction,
        String sharedContent,
        String audioUrl,
        String imageUrl,
        String groupData,
        Long lessonId,
        List<QuestionResponse> questions
) {
}