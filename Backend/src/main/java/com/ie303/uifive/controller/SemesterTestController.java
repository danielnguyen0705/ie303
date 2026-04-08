package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.SemesterTestRequest;
import com.ie303.uifive.dto.res.SemesterTestResponse;
import com.ie303.uifive.service.SemesterTestService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/semester-tests")
@RequiredArgsConstructor
public class SemesterTestController {

    private final SemesterTestService service;

    @PostMapping
    @RolesAllowed("ADMIN")
    public SemesterTestResponse create(@RequestBody @Valid SemesterTestRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public SemesterTestResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<SemesterTestResponse> getAll() {
        return service.getAll();
    }

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public SemesterTestResponse update(@PathVariable Long id,
                                       @RequestBody @Valid SemesterTestRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted semester test";
    }
}