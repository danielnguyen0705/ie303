package com.ie303.uifive.client;

import com.ie303.uifive.dto.req.QuestionOptionRequest;
import com.ie303.uifive.dto.req.QuestionRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.GradeResponse;
import com.ie303.uifive.dto.res.LessonQuestionResponse;
import com.ie303.uifive.dto.res.LessonResponse;
import com.ie303.uifive.dto.res.QuestionGroupResponse;
import com.ie303.uifive.dto.res.QuestionOptionResponse;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.dto.res.SectionResponse;
import com.ie303.uifive.dto.res.UnitResponse;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ContentServiceClient {

    private final RestTemplate restTemplate;
    private final RequestAuthHeadersProvider authHeadersProvider;

    @Value("${content.service.base-url:http://localhost:8086}")
    private String baseUrl;

    public QuestionResponse getQuestion(Long questionId) {
        return extractResult(exchange("/api/questions/" + questionId, HttpMethod.GET, null,
                new ParameterizedTypeReference<ApiResponse<QuestionResponse>>() {
                }), QuestionResponse.class, ErrorCode.QUESTION_NOT_FOUND);
    }

    public QuestionGroupResponse getQuestionGroup(Long questionGroupId) {
        return extractResult(exchange("/api/question-groups/" + questionGroupId, HttpMethod.GET, null,
                new ParameterizedTypeReference<ApiResponse<QuestionGroupResponse>>() {
                }), QuestionGroupResponse.class, ErrorCode.QUESTION_GROUP_NOT_FOUND);
    }

    public LessonResponse getLesson(Long lessonId) {
        return extractResult(exchange("/api/lessons/" + lessonId, HttpMethod.GET, null,
                new ParameterizedTypeReference<ApiResponse<LessonResponse>>() {
                }), LessonResponse.class, ErrorCode.LESSON_NOT_FOUND);
    }

    public SectionResponse getSection(Long sectionId) {
        return extractResult(exchange("/api/sections/" + sectionId, HttpMethod.GET, null,
                new ParameterizedTypeReference<ApiResponse<SectionResponse>>() {
                }), SectionResponse.class, ErrorCode.SECTION_NOT_FOUND);
    }

    public UnitResponse getUnit(Long unitId) {
        return extractResult(exchange("/api/units/" + unitId, HttpMethod.GET, null,
                new ParameterizedTypeReference<ApiResponse<UnitResponse>>() {
                }), UnitResponse.class, ErrorCode.UNIT_NOT_FOUND);
    }

    public GradeResponse getGrade(Long gradeId) {
        return extractResult(exchange("/api/grades/" + gradeId, HttpMethod.GET, null,
                new ParameterizedTypeReference<ApiResponse<GradeResponse>>() {
                }), GradeResponse.class, ErrorCode.GRADE_NOT_FOUND);
    }

    public LessonQuestionResponse getQuestionsByLesson(Long lessonId) {
        return extractResult(exchange("/api/questions/lesson/" + lessonId, HttpMethod.GET, null,
                new ParameterizedTypeReference<ApiResponse<LessonQuestionResponse>>() {
                }), LessonQuestionResponse.class, ErrorCode.LESSON_NOT_FOUND);
    }

    public QuestionResponse createQuestion(QuestionRequest request) {
        HttpHeaders headers = authHeadersProvider.createAuthHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        addFormField(body, "questionType", request.questionType() == null ? null : request.questionType().name());
        addFormField(body, "content", request.content());
        addFormField(body, "instruction", request.instruction());
        addFormField(body, "hint", request.hint());
        addFormField(body, "audioUrl", request.audioUrl());
        addFormField(body, "imageUrl", request.imageUrl());
        addFormField(body, "questionData", request.questionData());
        addFormField(body, "explanation", request.explanation());
        addFormField(body, "correctAnswer", request.correctAnswer());
        addFormField(body, "lessonId", request.lessonId());
        addFormField(body, "questionGroupId", request.questionGroupId());

        ResponseEntity<ApiResponse<QuestionResponse>> response = restTemplate.exchange(
                baseUrl + "/api/questions",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                new ParameterizedTypeReference<ApiResponse<QuestionResponse>>() {
                }
        );
        return requireResult(response, QuestionResponse.class, ErrorCode.INVALID_REQUEST);
    }

    public QuestionOptionResponse createQuestionOption(QuestionOptionRequest request) {
        HttpHeaders headers = authHeadersProvider.createAuthHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<ApiResponse<QuestionOptionResponse>> response = restTemplate.exchange(
                baseUrl + "/api/question-options",
                HttpMethod.POST,
                new HttpEntity<>(request, headers),
                new ParameterizedTypeReference<ApiResponse<QuestionOptionResponse>>() {
                }
        );
        return requireResult(response, QuestionOptionResponse.class, ErrorCode.INVALID_REQUEST);
    }

    private <T> ResponseEntity<ApiResponse<T>> exchange(
            String path,
            HttpMethod method,
            Object body,
            ParameterizedTypeReference<ApiResponse<T>> responseType
    ) {
        HttpHeaders headers = authHeadersProvider.createAuthHeaders();
        HttpEntity<?> entity = body == null ? new HttpEntity<>(headers) : new HttpEntity<>(body, headers);
        return restTemplate.exchange(baseUrl + path, method, entity, responseType);
    }

    private <T> T extractResult(ResponseEntity<ApiResponse<T>> response, Class<T> type, ErrorCode errorCode) {
        return requireResult(response, type, errorCode);
    }

    private <T> T requireResult(ResponseEntity<ApiResponse<T>> response, Class<T> type, ErrorCode errorCode) {
        if (response == null || response.getBody() == null || response.getBody().getResult() == null) {
            throw new AppException(errorCode);
        }

        return response.getBody().getResult();
    }

    private void addFormField(MultiValueMap<String, Object> body, String name, Object value) {
        if (value == null) {
            return;
        }

        body.add(name, String.valueOf(value));
    }
}
