package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UnitRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UnitResponse;
import com.ie303.uifive.service.UnitService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/units")
@RequiredArgsConstructor
public class UnitController {

    private final UnitService service;

    @PostMapping
    @RolesAllowed("ADMIN")
    public UnitResponse create(@RequestBody @Valid UnitRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public ApiResponse<UnitResponse> getById(@PathVariable Long id) {
        return ApiResponse.<UnitResponse>builder()
                .code(1000)
                .result(service.getById(id))
                .build();
    }

    @GetMapping
    public ApiResponse<List<UnitResponse>> getAll() {
        return ApiResponse.<List<UnitResponse>>builder()
                .code(1000)
                .result(service.getAll())
                .build();
    }

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public UnitResponse update(@PathVariable Long id,
                               @RequestBody @Valid UnitRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted unit";
    }
}