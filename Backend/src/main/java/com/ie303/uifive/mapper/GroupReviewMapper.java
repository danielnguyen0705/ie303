package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.GroupReviewRequest;
import com.ie303.uifive.dto.res.GroupReviewResponse;
import com.ie303.uifive.entity.GroupReview;
import com.ie303.uifive.entity.Question;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface GroupReviewMapper {

    @Mapping(target = "gradeId", source = "grade.id")
    @Mapping(target = "questionIds", source = "questions", qualifiedByName = "mapQuestions")
    GroupReviewResponse toResponse(GroupReview entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "grade", ignore = true)
    @Mapping(target = "questions", ignore = true)
    GroupReview toEntity(GroupReviewRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "grade", ignore = true)
    @Mapping(target = "questions", ignore = true)
    void updateEntityFromRequest(GroupReviewRequest request, @MappingTarget GroupReview entity);

    @org.mapstruct.Named("mapQuestions")
    default List<Long> mapQuestionsToQuestionIds(List<Question> questions) {
        if (questions == null) return null;
        return questions.stream()
                .map(Question::getId)
                .toList();
    }
}