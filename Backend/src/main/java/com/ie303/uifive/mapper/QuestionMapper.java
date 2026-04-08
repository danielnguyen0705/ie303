package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.QuestionRequest;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.entity.Question;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface QuestionMapper {

    @Mapping(target = "lessonId", source = "lesson.id")
    @Mapping(target = "questionGroupId", source = "questionGroup.id")
    QuestionResponse toResponse(Question question);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "lesson", ignore = true)
    @Mapping(target = "questionGroup", ignore = true)
    Question toEntity(QuestionRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "lesson", ignore = true)
    @Mapping(target = "questionGroup", ignore = true)
    void updateEntityFromRequest(QuestionRequest request, @MappingTarget Question question);
}