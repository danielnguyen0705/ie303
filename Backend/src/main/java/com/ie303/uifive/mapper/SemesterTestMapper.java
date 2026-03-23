package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.SemesterTestRequest;
import com.ie303.uifive.dto.res.SemesterTestResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.SemesterTest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SemesterTestMapper {

    @Mapping(target = "gradeId", source = "grade.id")
    @Mapping(target = "questionIds", source = "questions")
    SemesterTestResponse toResponse(SemesterTest entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "grade", ignore = true)
    @Mapping(target = "questions", ignore = true)
    SemesterTest toEntity(SemesterTestRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "grade", ignore = true)
    @Mapping(target = "questions", ignore = true)
    void updateEntityFromRequest(SemesterTestRequest request, @MappingTarget SemesterTest entity);

    default List<Long> mapQuestionsToQuestionIds(List<Question> questions) {
        if (questions == null) {
            return null;
        }
        return questions.stream()
                .map(Question::getId)
                .toList();
    }
}