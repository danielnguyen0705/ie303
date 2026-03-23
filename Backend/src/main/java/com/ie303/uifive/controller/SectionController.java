package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.SectionRequest;
import com.ie303.uifive.dto.res.SectionResponse;
import com.ie303.uifive.service.SectionService;
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
    public SectionResponse create(@RequestBody @Valid SectionRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public SectionResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<SectionResponse> getAll() {
        return service.getAll();
    }

    @PutMapping("/{id}")
    public SectionResponse update(@PathVariable Long id,
                                  @RequestBody @Valid SectionRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted section with id: " + id;
    }
}