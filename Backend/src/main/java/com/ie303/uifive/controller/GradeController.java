package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.GradeRequest;
import com.ie303.uifive.dto.res.GradeResponse;
import com.ie303.uifive.service.GradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService service;

    @PostMapping
    public GradeResponse create(@RequestBody GradeRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public GradeResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<GradeResponse> getAll() {
        return service.getAll();
    }

    @PutMapping("/{id}")
    public GradeResponse update(@PathVariable Long id,
                                @RequestBody GradeRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted grade";
    }
}