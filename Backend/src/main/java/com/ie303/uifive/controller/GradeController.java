package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.GradeRequest;
import com.ie303.uifive.dto.res.GradeResponse;
import com.ie303.uifive.service.GradeService;
import jakarta.annotation.security.RolesAllowed;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    @PostMapping
    @RolesAllowed("ADMIN")
    public GradeResponse create(@RequestBody GradeRequest request) {
        return gradeService.create(request);
    }

    @GetMapping("/{id}")
    public GradeResponse getById(@PathVariable Long id) {
        return gradeService.getById(id);
    }

    @GetMapping
    public List<GradeResponse> getAll() {
        return gradeService.getAll();
    }

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public GradeResponse update(@PathVariable Long id,
                                @RequestBody GradeRequest request) {
        return gradeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public String delete(@PathVariable Long id) {
        gradeService.delete(id);
        return "Deleted grade";
    }
}