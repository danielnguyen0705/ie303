package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.LessonRequest;
import com.ie303.uifive.dto.res.LessonResponse;
import com.ie303.uifive.entity.Lesson;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface LessonMapper {

    @Mapping(target = "sectionId", source = "section.id")
    LessonResponse toResponse(Lesson lesson);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "section", ignore = true)
    @Mapping(target = "questions", ignore = true)
    @Mapping(target = "questionGroups", ignore = true)
    @Mapping(target = "reviewLesson", source = "isReviewLesson")
    @Mapping(target = "vipOnly", source = "isVipOnly")
    Lesson toEntity(LessonRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "section", ignore = true)
    @Mapping(target = "questions", ignore = true)
    @Mapping(target = "questionGroups", ignore = true)
    @Mapping(target = "reviewLesson", source = "isReviewLesson")
    @Mapping(target = "vipOnly", source = "isVipOnly")
    void updateEntityFromRequest(LessonRequest request, @MappingTarget Lesson lesson);
}
