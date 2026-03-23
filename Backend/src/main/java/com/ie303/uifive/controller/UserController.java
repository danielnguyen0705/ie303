package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UserRequest;
import com.ie303.uifive.dto.res.UserResponse;
import com.ie303.uifive.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService service;

    @PostMapping
    public UserResponse create(@RequestBody @Valid UserRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public UserResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<UserResponse> getAll() {
        return service.getAll();
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id,
                               @RequestBody @Valid UserRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted user";
    }

    // ===== STUDY =====
    @PostMapping("/{id}/study")
    public String study(@PathVariable Long id) {
        service.updateStudyProgress(id);
        return "Updated study progress";
    }
}