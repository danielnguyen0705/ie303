package com.ie303.uifive.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {

    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),

    USER_NOT_FOUND(1005, "User not found", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    METHOD_NOT_ALLOWED(1011, "Request method is not supported", HttpStatus.METHOD_NOT_ALLOWED),
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
    PAYMENT_WEBHOOK_INVALID(1048, "Payment webhook is invalid", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}
