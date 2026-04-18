package com.ie303.uifive.dto.req;

public record PersonalizedQuestionRequest(
        Integer questionCount,
        Long gradeId,
        Integer startUnit,
        Integer endUnit,
        String topic
) {
}
