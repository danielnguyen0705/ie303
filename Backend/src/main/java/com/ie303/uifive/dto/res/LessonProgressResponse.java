package com.ie303.uifive.dto.res;

public record LessonProgressResponse(
        Long lessonId,
        String lessonTitle,
        int lessonNumber,
        boolean reviewLesson,
        boolean completed,
        boolean unlocked,
        boolean current
) {
}
