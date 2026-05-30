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
    SHOP_ITEM_NOT_FOUND(1028, "Shop item not found", HttpStatus.NOT_FOUND),
    USER_ITEM_NOT_FOUND(1029, "User item not found", HttpStatus.NOT_FOUND),
    ITEM_NOT_AVAILABLE(1030, "Item is not available", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_COIN(1031, "You do not have enough coin", HttpStatus.BAD_REQUEST),
    INVALID_ITEM_TYPE(1032, "Invalid item type", HttpStatus.BAD_REQUEST),
    ITEM_ALREADY_OWNED(1033, "Item already owned", HttpStatus.BAD_REQUEST),
    ITEM_NOT_OWNED(1034, "Item is not owned by user", HttpStatus.BAD_REQUEST),
    INVALID_SHOP_ITEM_REQUEST(1035, "Shop item request is invalid", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED(1036, "File upload failed", HttpStatus.BAD_GATEWAY),
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
