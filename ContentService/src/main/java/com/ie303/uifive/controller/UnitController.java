package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UnitRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UnitResponse;
import com.ie303.uifive.service.UnitService;
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
@RequestMapping("/api/units")
@RequiredArgsConstructor
@RolesAllowed({"USER", "ADMIN"})
public class UnitController {

    private final UnitService unitService;

    @PostMapping
    @RolesAllowed("ADMIN")
    public ApiResponse<UnitResponse> create(@RequestBody @Valid UnitRequest request) {
        return ApiResponse.<UnitResponse>builder().code(1000).result(unitService.create(request)).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<UnitResponse> getById(@PathVariable Long id) {
        return ApiResponse.<UnitResponse>builder().code(1000).result(unitService.getById(id)).build();
    }

    @GetMapping
    public ApiResponse<List<UnitResponse>> getAll() {
        return ApiResponse.<List<UnitResponse>>builder().code(1000).result(unitService.getAll()).build();
    }

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<UnitResponse> update(@PathVariable Long id, @RequestBody @Valid UnitRequest request) {
        return ApiResponse.<UnitResponse>builder().code(1000).result(unitService.update(id, request)).build();
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<String> delete(@PathVariable Long id) {
        unitService.delete(id);
        return ApiResponse.<String>builder().code(1000).message("Deleted unit").result("Deleted unit with id: " + id).build();
    }
}
