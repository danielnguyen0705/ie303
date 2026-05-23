package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.QuestionGroupRequest;
import com.ie303.uifive.dto.res.QuestionGroupResponse;
import com.ie303.uifive.entity.QuestionGroup;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface QuestionGroupMapper {

    @Mapping(target = "lessonId", source = "lesson.id")
    QuestionGroupResponse toResponse(QuestionGroup entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "lesson", ignore = true)
    @Mapping(target = "audioUrl", ignore = true)
    @Mapping(target = "imageUrl", ignore = true)
    QuestionGroup toEntity(QuestionGroupRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "lesson", ignore = true)
    @Mapping(target = "audioUrl", ignore = true)
    @Mapping(target = "imageUrl", ignore = true)
    void updateEntityFromRequest(QuestionGroupRequest request, @MappingTarget QuestionGroup entity);
}