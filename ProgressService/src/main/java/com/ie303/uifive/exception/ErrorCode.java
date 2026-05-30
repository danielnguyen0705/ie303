package com.ie303.uifive.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    METHOD_NOT_ALLOWED(1011, "Request method is not supported", HttpStatus.METHOD_NOT_ALLOWED),
    VIP_REQUIRED(1048, "This feature requires an active VIP subscription", HttpStatus.FORBIDDEN),
    GRADE_NOT_FOUND(1020, "Grade not found", HttpStatus.NOT_FOUND),
    UNIT_NOT_FOUND(1021, "Unit not found", HttpStatus.NOT_FOUND),
    SECTION_NOT_FOUND(1022, "Section not found", HttpStatus.NOT_FOUND),
    LESSON_NOT_FOUND(1008, "Lesson not found", HttpStatus.NOT_FOUND),
    LESSON_LOCKED(1023, "Lesson is locked. Complete the previous lesson first", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1005, "User not found", HttpStatus.NOT_FOUND),
    QUESTION_NOT_FOUND(1018, "Question not found", HttpStatus.NOT_FOUND),
    VALIDATION_ERROR(1038, "Validation failed", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST_BODY(1039, "Request body is invalid", HttpStatus.BAD_REQUEST),
    MISSING_REQUEST_PART(1040, "Required request data is missing", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(1041, "Request is invalid", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}
