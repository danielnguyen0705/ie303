package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.UserQuestionHistoryRequest;
import com.ie303.uifive.dto.res.UserQuestionHistoryResponse;
import com.ie303.uifive.entity.UserQuestionHistory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserQuestionHistoryMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "questionId", source = "question.id")
    UserQuestionHistoryResponse toResponse(UserQuestionHistory entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "question", ignore = true)
    @Mapping(target = "correct", ignore = true)
    UserQuestionHistory toEntity(UserQuestionHistoryRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "question", ignore = true)
    @Mapping(target = "correct", ignore = true)
    void updateEntityFromRequest(UserQuestionHistoryRequest request, @MappingTarget UserQuestionHistory entity);
}