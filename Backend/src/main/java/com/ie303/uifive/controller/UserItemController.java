package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UserItemRequest;
import com.ie303.uifive.dto.res.UserItemResponse;
import com.ie303.uifive.service.UserItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-items")
@RequiredArgsConstructor
public class UserItemController {

    private final UserItemService service;

    @PostMapping
    public UserItemResponse create(@RequestBody UserItemRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public UserItemResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<UserItemResponse> getAll() {
        return service.getAll();
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted user item";
    }
}