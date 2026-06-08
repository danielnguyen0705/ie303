package com.ie303.uifive.client;

import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.req.UserQuestionHistoryRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.LessonProgressResponse;
import com.ie303.uifive.dto.res.SectionProgressResponse;
import com.ie303.uifive.dto.res.UnitProgressResponse;
import com.ie303.uifive.dto.res.UserLessonProgressResponse;
import com.ie303.uifive.dto.res.UserQuestionHistoryResponse;
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
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ProgressServiceClient {

    private final RestTemplate restTemplate;
    private final RequestAuthHeadersProvider authHeadersProvider;

    @Value("${progress.service.base-url:http://localhost:8087}")
    private String baseUrl;

    public UserLessonProgressResponse completeLesson(UserLessonProgressRequest request) {
        return exchangeJson(
                "/api/progress/lessons/complete",
                HttpMethod.POST,
                request,
                new ParameterizedTypeReference<ApiResponse<UserLessonProgressResponse>>() {
                },
                ErrorCode.INVALID_REQUEST
        );
    }

    public UserQuestionHistoryResponse submitQuestionHistory(UserQuestionHistoryRequest request) {
        return exchangeJson(
                "/api/user-question-histories/submit",
                HttpMethod.POST,
                request,
                new ParameterizedTypeReference<ApiResponse<UserQuestionHistoryResponse>>() {
                },
                ErrorCode.INVALID_REQUEST
        );
    }

    public List<UserQuestionHistoryResponse> getMyQuestionHistories() {
        return exchangeJson(
                "/api/user-question-histories/me",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<ApiResponse<List<UserQuestionHistoryResponse>>>() {
                },
                ErrorCode.INVALID_REQUEST
        );
    }

    public List<UnitProgressResponse> getUnitsByGrade(Long gradeId) {
        return exchangeJson(
                "/api/progress/grades/" + gradeId + "/units",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<ApiResponse<List<UnitProgressResponse>>>() {
                },
                ErrorCode.GRADE_NOT_FOUND
        );
    }

    public List<SectionProgressResponse> getSectionsByUnit(Long unitId) {
        return exchangeJson(
                "/api/progress/units/" + unitId + "/sections",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<ApiResponse<List<SectionProgressResponse>>>() {
                },
                ErrorCode.UNIT_NOT_FOUND
        );
    }

    public List<LessonProgressResponse> getLessonsBySection(Long sectionId) {
        return exchangeJson(
                "/api/progress/sections/" + sectionId + "/lessons",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<ApiResponse<List<LessonProgressResponse>>>() {
                },
                ErrorCode.SECTION_NOT_FOUND
        );
    }

    public List<LessonProgressResponse> getReviewLessonsBySection(Long sectionId) {
        return exchangeJson(
                "/api/progress/sections/" + sectionId + "/review-lessons",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<ApiResponse<List<LessonProgressResponse>>>() {
                },
                ErrorCode.SECTION_NOT_FOUND
        );
    }

    private <T> T exchangeJson(
            String path,
            HttpMethod method,
            Object body,
            ParameterizedTypeReference<ApiResponse<T>> responseType,
            ErrorCode errorCode
    ) {
        HttpHeaders headers = authHeadersProvider.createAuthHeaders();
        if (body != null) {
            headers.setContentType(MediaType.APPLICATION_JSON);
        }

        HttpEntity<?> entity = body == null ? new HttpEntity<>(headers) : new HttpEntity<>(body, headers);
        ResponseEntity<ApiResponse<T>> response = restTemplate.exchange(baseUrl + path, method, entity, responseType);

        if (response.getBody() == null || response.getBody().getResult() == null) {
            throw new AppException(errorCode);
        }

        return response.getBody().getResult();
    }
}
