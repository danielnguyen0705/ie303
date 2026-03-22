package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.GroupReviewRequest;
import com.ie303.uifive.dto.res.GroupReviewResponse;
import com.ie303.uifive.service.GroupReviewService;
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
    public GroupReviewResponse create(@RequestBody @Valid GroupReviewRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public GroupReviewResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<GroupReviewResponse> getAll() {
        return service.getAll();
    }

    @PutMapping("/{id}")
    public GroupReviewResponse update(@PathVariable Long id,
                                      @RequestBody GroupReviewRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted successfully";
    }
}