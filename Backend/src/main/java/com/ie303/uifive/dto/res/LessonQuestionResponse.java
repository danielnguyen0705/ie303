package com.ie303.uifive.dto.res;

import java.util.List;

public record LessonQuestionResponse(
        Long lessonId,
        List<QuestionResponse> singleQuestions,
        List<QuestionGroupResponse> questionGroups
) {
}
