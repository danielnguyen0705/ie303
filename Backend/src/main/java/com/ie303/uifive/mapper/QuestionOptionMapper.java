package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.QuestionOptionRequest;
import com.ie303.uifive.dto.res.QuestionOptionResponse;
import com.ie303.uifive.entity.QuestionOption;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface QuestionOptionMapper {

    @Mapping(target = "questionId", source = "question.id")
    QuestionOptionResponse toResponse(QuestionOption entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "question", ignore = true)
    QuestionOption toEntity(QuestionOptionRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "question", ignore = true)
    void updateEntityFromRequest(QuestionOptionRequest request, @MappingTarget QuestionOption entity);
}