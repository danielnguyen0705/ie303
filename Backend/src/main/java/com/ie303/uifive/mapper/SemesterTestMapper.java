package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.SemesterTestRequest;
import com.ie303.uifive.dto.res.SemesterTestResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionGroup;
import com.ie303.uifive.entity.SemesterTest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SemesterTestMapper {

    @Mapping(target = "gradeId", source = "grade.id")
    @Mapping(target = "questionIds", source = "questions")
    @Mapping(target = "questionGroupIds", source = "questionGroups")
    SemesterTestResponse toResponse(SemesterTest entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "grade", ignore = true)
    @Mapping(target = "questions", ignore = true)
    @Mapping(target = "questionGroups", ignore = true)
    SemesterTest toEntity(SemesterTestRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "grade", ignore = true)
    @Mapping(target = "questions", ignore = true)
    @Mapping(target = "questionGroups", ignore = true)
    void updateEntityFromRequest(SemesterTestRequest request, @MappingTarget SemesterTest entity);

    default List<Long> mapQuestionsToQuestionIds(List<Question> questions) {
        if (questions == null) {
            return null;
        }
        return questions.stream()
                .map(Question::getId)
                .toList();
    }

    default List<Long> mapQuestionGroupsToQuestionGroupIds(List<QuestionGroup> questionGroups) {
        if (questionGroups == null) {
            return null;
        }
        return questionGroups.stream()
                .map(QuestionGroup::getId)
                .toList();
    }
}