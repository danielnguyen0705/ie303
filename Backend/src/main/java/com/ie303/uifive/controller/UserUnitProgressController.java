package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UserUnitProgressRequest;
import com.ie303.uifive.dto.res.UserUnitProgressResponse;
import com.ie303.uifive.service.UserUnitProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/unit-progress")
@RequiredArgsConstructor
public class UserUnitProgressController {

    private final UserUnitProgressService service;

    @PostMapping
    public UserUnitProgressResponse update(@RequestBody UserUnitProgressRequest request) {
        return service.updateProgress(request);
    }

    @PostMapping("/unlock")
    public UserUnitProgressResponse unlock(@RequestParam Long userId,
                                           @RequestParam Long unitId) {
        return service.unlockUnit(userId, unitId);
    }

    @GetMapping("/{id}")
    public UserUnitProgressResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<UserUnitProgressResponse> getAll() {
        return service.getAll();
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted unit progress";
    }
}