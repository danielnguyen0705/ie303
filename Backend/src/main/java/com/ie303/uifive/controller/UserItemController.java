package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UserItemRequest;
import com.ie303.uifive.dto.res.ApiResponse;
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
    public ApiResponse<UserItemResponse> getById(@PathVariable Long id) {
        return ApiResponse.<UserItemResponse>builder()
                .code(1000)
                .result(service.getById(id))
                .build();
    }

    @GetMapping
    public ApiResponse<List<UserItemResponse>> getAll() {
        return ApiResponse.<List<UserItemResponse>>builder()
                .code(1000)
                .result(service.getAll())
                .build();
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted user item";
    }
}