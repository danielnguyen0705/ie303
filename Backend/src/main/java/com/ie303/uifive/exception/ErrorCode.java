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
    SAME_PASSWORD(1017, "New password must be different", HttpStatus.BAD_REQUEST),

    QUESTION_NOT_FOUND(1018, "Question not found", HttpStatus.NOT_FOUND),
    GEMINI_NOT_RESPONSE(1019, "Gemini is temporarily unavailable", HttpStatus.BAD_GATEWAY),

    GRADE_NOT_FOUND(1020, "Grade not found", HttpStatus.NOT_FOUND),
    UNIT_NOT_FOUND(1021, "Unit not found", HttpStatus.NOT_FOUND),
    SECTION_NOT_FOUND(1022, "Section not found", HttpStatus.NOT_FOUND),
    LESSON_LOCKED(1023, "Lesson is locked. Complete the previous lesson first", HttpStatus.BAD_REQUEST),
    GEMINI_INVALID_RESPONSE(1024, "Gemini returned invalid response", HttpStatus.BAD_GATEWAY),
    GEMINI_NOT_CONFIGURED(1025, "Gemini is not configured", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_ESSAY_ANSWER(1026, "Essay answer must not be blank", HttpStatus.BAD_REQUEST),
    QUESTION_GROUP_NOT_FOUND(1027, "Question group not found", HttpStatus.NOT_FOUND),
    SHOP_ITEM_NOT_FOUND(1028, "Shop item not found", HttpStatus.NOT_FOUND),
    USER_ITEM_NOT_FOUND(1029, "User item not found", HttpStatus.NOT_FOUND),
    ITEM_NOT_AVAILABLE(1030, "Item is not available", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_COIN(1031, "You do not have enough coin", HttpStatus.BAD_REQUEST),
    INVALID_ITEM_TYPE(1032, "Invalid item type", HttpStatus.BAD_REQUEST),
    ITEM_ALREADY_OWNED(1033, "Item already owned", HttpStatus.BAD_REQUEST),
    ITEM_NOT_OWNED(1034, "Item is not owned by user", HttpStatus.BAD_REQUEST),
    INVALID_SHOP_ITEM_REQUEST(1035, "Shop item request is invalid", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED(1036, "File upload failed", HttpStatus.BAD_GATEWAY),
    EMAIL_SEND_FAILED(1037, "Email could not be sent", HttpStatus.BAD_GATEWAY),
    VALIDATION_ERROR(1038, "Validation failed", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST_BODY(1039, "Request body is invalid", HttpStatus.BAD_REQUEST),
    MISSING_REQUEST_PART(1040, "Required request data is missing", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(1041, "Request is invalid", HttpStatus.BAD_REQUEST),

    PAYMENT_OFFER_NOT_FOUND(1042, "Payment offer not found", HttpStatus.NOT_FOUND),
    PAYMENT_OFFER_NOT_AVAILABLE(1043, "Payment offer is not available", HttpStatus.BAD_REQUEST),
    PAYMENT_TRANSACTION_NOT_FOUND(1044, "Payment transaction not found", HttpStatus.NOT_FOUND),
    PAYMENT_TRANSACTION_INVALID_STATUS(1045, "Payment transaction has invalid status", HttpStatus.BAD_REQUEST),
    PAYMENT_PROVIDER_NOT_SUPPORTED(1046, "Payment provider is not supported", HttpStatus.BAD_REQUEST),
    PAYMENT_SIGNATURE_INVALID(1047, "Payment signature is invalid", HttpStatus.UNAUTHORIZED),
    VIP_REQUIRED(1048, "This feature requires an active VIP subscription", HttpStatus.FORBIDDEN),
    NO_WRONG_QUESTIONS_FOUND(1049, "No wrong questions found for personalized practice", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}
