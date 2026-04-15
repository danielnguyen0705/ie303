package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.GroupReviewRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.GroupReviewResponse;
import com.ie303.uifive.service.GroupReviewService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/group-reviews")
@RequiredArgsConstructor
public class GroupReviewController {

    private final GroupReviewService service;

    @PostMapping
    @RolesAllowed("ADMIN")
    public ApiResponse<GroupReviewResponse> create(@RequestBody @Valid GroupReviewRequest request) {
        return ApiResponse.<GroupReviewResponse>builder()
                .code(1000)
                .result(service.create(request))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<GroupReviewResponse> getById(@PathVariable Long id) {
        return ApiResponse.<GroupReviewResponse>builder()
                .code(1000)
                .result(service.getById(id))
                .build();
    }

    @GetMapping
    public ApiResponse<List<GroupReviewResponse>> getAll() {
        return ApiResponse.<List<GroupReviewResponse>>builder()
                .code(1000)
                .result(service.getAll())
                .build();
    }

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<GroupReviewResponse> update(@PathVariable Long id,
                                                   @RequestBody GroupReviewRequest request) {
        return ApiResponse.<GroupReviewResponse>builder()
                .code(1000)
                .result(service.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Deleted successfully")
                .result("Deleted successfully")
                .build();
    }
}