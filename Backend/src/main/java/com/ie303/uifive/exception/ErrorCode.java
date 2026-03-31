package com.ie303.uifive.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {

    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),

    INVALID_USERNAME(1001, "Invalid username", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1002, "Invalid password", HttpStatus.BAD_REQUEST),

    USER_EXISTED(1003, "User already exists", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1004, "Email already exists", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1005, "User not found", HttpStatus.NOT_FOUND),

    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),

    LESSON_NOT_FOUND(1008, "Lesson not found", HttpStatus.NOT_FOUND),

    METHOD_NOT_ALLOWED(1011, "Request method is not supported", HttpStatus.METHOD_NOT_ALLOWED),

    ACCOUNT_NOT_VERIFIED(1012, "Account is not verified", HttpStatus.BAD_REQUEST),
    ACCOUNT_ALREADY_VERIFIED(1013, "Account already verified", HttpStatus.BAD_REQUEST),
    INVALID_VERIFICATION_TOKEN(1014, "Invalid verification token", HttpStatus.BAD_REQUEST),
    VERIFICATION_TOKEN_EXPIRED(1015, "Verification token has expired", HttpStatus.BAD_REQUEST),

    INVALID_OLD_PASSWORD(1016, "Old password is incorrect", HttpStatus.BAD_REQUEST),
    SAME_PASSWORD(1017, "New password must be different", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}