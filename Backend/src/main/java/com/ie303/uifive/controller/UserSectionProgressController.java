package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UserSectionProgressRequest;
import com.ie303.uifive.dto.res.UserSectionProgressResponse;
import com.ie303.uifive.service.UserSectionProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/section-progress")
@RequiredArgsConstructor
public class UserSectionProgressController {

    private final UserSectionProgressService service;

    @PostMapping
    public UserSectionProgressResponse update(@RequestBody UserSectionProgressRequest request) {
        return service.updateProgress(request);
    }

    @GetMapping("/{id}")
    public UserSectionProgressResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<UserSectionProgressResponse> getAll() {
        return service.getAll();
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted section progress";
    }
}