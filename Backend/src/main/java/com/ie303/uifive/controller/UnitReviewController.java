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
    public UnitReviewResponse create(@RequestBody @Valid UnitReviewRequest request) {
        return service.create(request);
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
    public UnitReviewResponse update(@PathVariable Long id,
                                     @RequestBody @Valid UnitReviewRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted unit review";
    }
}