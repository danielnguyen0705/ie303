package com.ie303.uifive.dto.res;

public record LessonProgressResponse(
        Long lessonId,
        String lessonTitle,
        int lessonNumber,
        Integer orderIndex,
        boolean reviewLesson,
        boolean vipOnly,
        boolean completed,
        boolean unlocked,
        boolean current
) {
}
