package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.res.UserLessonProgressResponse;
import com.ie303.uifive.entity.UserLessonProgress;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserLessonProgressMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "lessonId", source = "lesson.id")
    @Mapping(target = "expEarned", constant = "0")
    @Mapping(target = "currentExp", source = "user.exp")
    UserLessonProgressResponse toResponse(UserLessonProgress entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "lesson", ignore = true)
    @Mapping(target = "completed", ignore = true)
    @Mapping(target = "coinsEarned", ignore = true)
    UserLessonProgress toEntity(UserLessonProgressRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "lesson", ignore = true)
    @Mapping(target = "completed", ignore = true)
    @Mapping(target = "coinsEarned", ignore = true)
    void updateEntityFromRequest(UserLessonProgressRequest request, @MappingTarget UserLessonProgress entity);
}