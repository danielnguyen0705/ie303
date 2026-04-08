package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.ShopItemRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.ShopItemResponse;
import com.ie303.uifive.service.ShopItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shop-items")
@RequiredArgsConstructor
public class ShopItemController {

    private final ShopItemService service;

    @PostMapping
    public ShopItemResponse create(@RequestBody @Valid ShopItemRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public ApiResponse<ShopItemResponse> getById(@PathVariable Long id) {
        return ApiResponse.<ShopItemResponse>builder()
                .code(1000)
                .result(service.getById(id))
                .build();
    }

    @GetMapping
    public ApiResponse<List<ShopItemResponse>> getAll() {
        return ApiResponse.<List<ShopItemResponse>>builder()
                .code(1000)
                .result(service.getAll())
                .build();
    }

    @PutMapping("/{id}")
    public ShopItemResponse update(@PathVariable Long id,
                                   @RequestBody @Valid ShopItemRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted shop item";
    }
}