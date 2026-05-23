package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.SectionRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.SectionResponse;
import com.ie303.uifive.service.SectionService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sections")
@RequiredArgsConstructor
@RolesAllowed({"USER", "ADMIN"})
public class SectionController {

    private final SectionService sectionService;

    @PostMapping
    @RolesAllowed("ADMIN")
    public ApiResponse<SectionResponse> create(@RequestBody @Valid SectionRequest request) {
        return ApiResponse.<SectionResponse>builder().code(1000).result(sectionService.create(request)).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<SectionResponse> getById(@PathVariable Long id) {
        return ApiResponse.<SectionResponse>builder().code(1000).result(sectionService.getById(id)).build();
    }

    @GetMapping
    public ApiResponse<List<SectionResponse>> getAll() {
        return ApiResponse.<List<SectionResponse>>builder().code(1000).result(sectionService.getAll()).build();
    }

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<SectionResponse> update(@PathVariable Long id, @RequestBody @Valid SectionRequest request) {
        return ApiResponse.<SectionResponse>builder().code(1000).result(sectionService.update(id, request)).build();
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<String> delete(@PathVariable Long id) {
        sectionService.delete(id);
        return ApiResponse.<String>builder().code(1000).message("Deleted section").result("Deleted section with id: " + id).build();
    }
}
