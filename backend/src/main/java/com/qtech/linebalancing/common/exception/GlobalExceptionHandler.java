package com.qtech.linebalancing.common.exception;

import com.qtech.linebalancing.common.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.TypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.HttpMediaTypeException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Centralised exception handler for all REST controllers.
 * Maps application exceptions to appropriate HTTP status codes and structured error responses.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle 404 — Resource not found.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handle 409 — Business rule violation.
     */
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessRule(BusinessRuleException ex) {
        log.warn("Business rule violation: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handle 400 — Illegal argument or bad request.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Illegal argument: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handle 400 — Bean validation failure (@Valid on request body).
     * Returns a map of field -> error message.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = error instanceof FieldError fe ? fe.getField() : error.getObjectName();
            errors.putIfAbsent(fieldName, error.getDefaultMessage());
        });
        log.warn("Validation failed: {}", errors);
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("Validation failed: " + describe(errors), errors));
    }

    /**
     * Handle 400 — Constraint violation (e.g., @Min, @Max on path/query params).
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolation(ConstraintViolationException ex) {
        log.warn("Constraint violation: {}", ex.getMessage());
        // Use only the leaf property name so internal method/parameter paths are not exposed.
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(v -> {
            String path = v.getPropertyPath().toString();
            String field = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
            errors.putIfAbsent(field, v.getMessage());
        });
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("Validation failed: " + describe(errors), errors));
    }

    /**
     * Handle 400 — Method-level validation (e.g. List<@Valid T> request bodies on @Validated controllers).
     */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleMethodValidation(HandlerMethodValidationException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getAllErrors().forEach(error -> {
            String field = error instanceof FieldError fe ? fe.getField() : "request";
            errors.putIfAbsent(field, error.getDefaultMessage());
        });
        log.warn("Method validation failed: {}", errors);
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("Validation failed: " + describe(errors), errors));
    }

    /**
     * Handle 400 — Malformed JSON body or a path/query parameter of the wrong type (e.g. /api/orders/abc).
     */
    @ExceptionHandler({HttpMessageNotReadableException.class, TypeMismatchException.class})
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(Exception ex) {
        log.warn("Bad request: {}", ex.getMessage());
        String message = ex instanceof TypeMismatchException tme && tme.getPropertyName() != null
                ? "Invalid value for parameter '" + tme.getPropertyName() + "'."
                : "Malformed request body.";
        return ResponseEntity.badRequest().body(ApiResponse.error(message));
    }

    /**
     * Spring MVC exceptions that already know their HTTP status: unknown URL (404), wrong method (405),
     * missing parameter (400), unsupported media type (415), upload too large (413), ResponseStatusException.
     */
    @ExceptionHandler({
            NoResourceFoundException.class,
            NoHandlerFoundException.class,
            HttpRequestMethodNotSupportedException.class,
            HttpMediaTypeException.class,
            ServletRequestBindingException.class,
            MaxUploadSizeExceededException.class,
            ResponseStatusException.class
    })
    public ResponseEntity<ApiResponse<Void>> handleSpringErrorResponse(Exception ex) {
        ErrorResponse errorResponse = (ErrorResponse) ex;
        HttpStatus status = HttpStatus.resolve(errorResponse.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.BAD_REQUEST;
        }
        log.warn("{} {}: {}", status.value(), ex.getClass().getSimpleName(), ex.getMessage());
        String detail = errorResponse.getBody().getDetail();
        return ResponseEntity.status(status)
                .body(ApiResponse.error(detail != null ? detail : status.getReasonPhrase()));
    }

    /**
     * Handle 409 — Two saves of the same record raced (JPA @Version check).
     */
    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<Void>> handleOptimisticLock(Exception ex) {
        log.warn("Optimistic lock conflict: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("This record was changed by someone else at the same time. Reload it and try again."));
    }

    /**
     * Handle 409 — Database integrity violation (unique constraint, FK violation).
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.error("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());
        String message = ex.getMostSpecificCause().getMessage();
        if (message != null && message.contains("duplicate key")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("A record with this value already exists. Please use a unique value."));
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("Database constraint violation. Please check your input."));
    }

    private static String describe(Map<String, String> errors) {
        return errors.entrySet().stream()
                .map(e -> e.getKey() + " " + e.getValue())
                .collect(Collectors.joining("; "));
    }

    /**
     * Catch-all for unexpected errors — 500.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred. Please contact support."));
    }
}
