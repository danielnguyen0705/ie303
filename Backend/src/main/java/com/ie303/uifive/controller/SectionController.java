package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.SectionRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.SectionResponse;
import com.ie303.uifive.service.SectionService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sections")
@RequiredArgsConstructor
public class SectionController {

    private final SectionService service;

    @PostMapping
    @RolesAllowed("ADMIN")
    public ApiResponse<SectionResponse> create(@RequestBody @Valid SectionRequest request) {
        return ApiResponse.<SectionResponse>builder()
                .code(1000)
                .result(service.create(request))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<SectionResponse> getById(@PathVariable Long id) {
        return ApiResponse.<SectionResponse>builder()
                .code(1000)
                .result(service.getById(id))
                .build();
    }

    @GetMapping
    public ApiResponse<List<SectionResponse>> getAll() {
        return ApiResponse.<List<SectionResponse>>builder()
                .code(1000)
                .result(service.getAll())
                .build();
    }

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<SectionResponse> update(@PathVariable Long id,
                                               @RequestBody @Valid SectionRequest request) {
        return ApiResponse.<SectionResponse>builder()
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
                .message("Deleted section")
                .result("Deleted section with id: " + id)
                .build();
    }
}