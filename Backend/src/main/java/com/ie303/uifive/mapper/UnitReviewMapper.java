package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.UnitReviewRequest;
import com.ie303.uifive.dto.res.UnitReviewResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.UnitReview;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UnitReviewMapper {

    @Mapping(target = "unitId", source = "unit.id")
    @Mapping(target = "questionIds", source = "questions")
    UnitReviewResponse toResponse(UnitReview entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "unit", ignore = true)
    @Mapping(target = "questions", ignore = true)
    UnitReview toEntity(UnitReviewRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "unit", ignore = true)
    @Mapping(target = "questions", ignore = true)
    void updateEntityFromRequest(UnitReviewRequest request, @MappingTarget UnitReview entity);

    default List<Long> mapQuestionsToQuestionIds(List<Question> questions) {
        if (questions == null) {
            return null;
        }
        return questions.stream()
                .map(Question::getId)
                .toList();
    }
}