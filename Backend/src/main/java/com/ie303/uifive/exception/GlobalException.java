package com.ie303.uifive.exception;

import com.ie303.uifive.dto.res.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;

@ControllerAdvice
@Slf4j
public class GlobalException {

    @ExceptionHandler(AppException.class)
    ResponseEntity<ApiResponse<Object>> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        return buildResponse(errorCode, exception.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiResponse<Object>> handlingAccessDeniedException(AccessDeniedException exception) {
        return buildResponse(ErrorCode.UNAUTHORIZED, null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiResponse<Object>> handlingMethodNotSupported(HttpRequestMethodNotSupportedException exception) {
        return buildResponse(ErrorCode.METHOD_NOT_ALLOWED, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<Object>> handlingMethodArgumentNotValid(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .filter(msg -> msg != null && !msg.isBlank())
                .findFirst()
                .orElse(ErrorCode.VALIDATION_ERROR.getMessage());
        return buildResponse(ErrorCode.VALIDATION_ERROR, message);
    }

    @ExceptionHandler(BindException.class)
    ResponseEntity<ApiResponse<Object>> handlingBindException(BindException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .filter(msg -> msg != null && !msg.isBlank())
                .findFirst()
                .orElse(ErrorCode.VALIDATION_ERROR.getMessage());
        return buildResponse(ErrorCode.VALIDATION_ERROR, message);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    ResponseEntity<ApiResponse<Object>> handlingMissingRequestParam(MissingServletRequestParameterException exception) {
        return buildResponse(
                ErrorCode.MISSING_REQUEST_PART,
                "Missing request parameter: " + exception.getParameterName()
        );
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    ResponseEntity<ApiResponse<Object>> handlingMissingRequestPart(MissingServletRequestPartException exception) {
        return buildResponse(
                ErrorCode.MISSING_REQUEST_PART,
                "Missing request part: " + exception.getRequestPartName()
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiResponse<Object>> handlingHttpMessageNotReadable(HttpMessageNotReadableException exception) {
        return buildResponse(ErrorCode.INVALID_REQUEST_BODY, null);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ApiResponse<Object>> handlingMediaTypeNotSupported(HttpMediaTypeNotSupportedException exception) {
        return buildResponse(ErrorCode.INVALID_REQUEST, "Content-Type is not supported");
    }

    @ExceptionHandler({MultipartException.class, MaxUploadSizeExceededException.class})
    ResponseEntity<ApiResponse<Object>> handlingMultipartException(Exception exception) {
        return buildResponse(ErrorCode.INVALID_REQUEST, "Multipart request is invalid");
    }

    @ExceptionHandler(RuntimeException.class)
    ResponseEntity<ApiResponse<Object>> handlingRuntimeException(RuntimeException exception) {
        log.error("Unhandled runtime exception", exception);
        String message = (exception.getMessage() == null || exception.getMessage().isBlank())
                ? ErrorCode.INVALID_REQUEST.getMessage()
                : exception.getMessage();
        return buildResponse(ErrorCode.INVALID_REQUEST, message);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiResponse<Object>> handlingException(Exception exception) {
        log.error("Unhandled exception", exception);
        return buildResponse(ErrorCode.UNCATEGORIZED_EXCEPTION, null);
    }

    private ResponseEntity<ApiResponse<Object>> buildResponse(ErrorCode errorCode, String message) {
        ApiResponse<Object> response = ApiResponse.builder()
                .code(errorCode.getCode())
                .message((message == null || message.isBlank()) ? errorCode.getMessage() : message)
                .build();

        return ResponseEntity.status(errorCode.getStatusCode()).body(response);
    }
}
