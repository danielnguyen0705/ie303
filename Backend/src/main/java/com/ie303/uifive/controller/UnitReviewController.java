package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UnitReviewRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UnitReviewResponse;
import com.ie303.uifive.service.UnitReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/unit-reviews")
@RequiredArgsConstructor
public class UnitReviewController {

    private final UnitReviewService service;

    @PostMapping
    public ApiResponse<UnitReviewResponse> create(@RequestBody @Valid UnitReviewRequest request) {
        return ApiResponse.<UnitReviewResponse>builder()
                .code(1000)
                .result(service.create(request))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<UnitReviewResponse> getById(@PathVariable Long id) {
        return ApiResponse.<UnitReviewResponse>builder()
                .code(1000)
                .result(service.getById(id))
                .build();
    }

    @GetMapping
    public ApiResponse<List<UnitReviewResponse>> getAll() {
        return ApiResponse.<List<UnitReviewResponse>>builder()
                .code(1000)
                .result(service.getAll())
                .build();
    }
    @PutMapping("/{id}")
    public ApiResponse<UnitReviewResponse> update(@PathVariable Long id,
                                                  @RequestBody @Valid UnitReviewRequest request) {
        return ApiResponse.<UnitReviewResponse>builder()
                .code(1000)
                .result(service.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Deleted unit review")
                .result("Deleted unit review")
                .build();
    }
}