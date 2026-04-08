package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.LessonType;
import com.ie303.uifive.entity.SkillType;

public record LessonResponse(
        Long id,
        Integer lessonNumber,
        String title,
        LessonType lessonType,
        SkillType skillType,
        boolean reviewLesson,
        Integer durationMinutes,
        boolean vipOnly,
        Integer orderIndex,
        Long sectionId
) {}