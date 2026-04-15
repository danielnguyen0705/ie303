package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.ShopItemRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.BuyItemResponse;
import com.ie303.uifive.dto.res.ShopItemResponse;
import com.ie303.uifive.dto.res.UserItemResponse;
import com.ie303.uifive.service.ShopItemService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.List;

@RestController
@RequestMapping("/api/shop-items")
@RequiredArgsConstructor
public class ShopItemController {

    private final ShopItemService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RolesAllowed("ADMIN")
    public ApiResponse<ShopItemResponse> create(@ModelAttribute @Valid ShopItemRequest request) {
        return ApiResponse.<ShopItemResponse>builder()
                .code(1000)
                .result(service.create(request))
                .build();
    }

    @GetMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<ShopItemResponse> getById(@PathVariable Long id) {
        return ApiResponse.<ShopItemResponse>builder()
                .code(1000)
                .result(service.getById(id))
                .build();
    }

    @GetMapping("/all")
    @RolesAllowed("ADMIN")
    public ApiResponse<List<ShopItemResponse>> getAll() {
        return ApiResponse.<List<ShopItemResponse>>builder()
                .code(1000)
                .result(service.getAll())
                .build();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RolesAllowed("ADMIN")
    public ApiResponse<ShopItemResponse> update(@PathVariable Long id,
                                                @ModelAttribute @Valid ShopItemRequest request) {
        return ApiResponse.<ShopItemResponse>builder()
                .code(1000)
                .result(service.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Deleted shop item")
                .result("Deleted shop item")
                .build();
    }

    @GetMapping
    public ApiResponse<List<ShopItemResponse>> getAllActive() {
        return ApiResponse.<List<ShopItemResponse>>builder()
                .result(service.getAllActive())
                .build();
    }

    @GetMapping("/my-items")
    public ApiResponse<List<UserItemResponse>> getMyItems() {
        return ApiResponse.<List<UserItemResponse>>builder()
                .result(service.getMyItems())
                .build();
    }

    @PostMapping("/buy/{itemId}")
    public ApiResponse<BuyItemResponse> buyItem(@PathVariable Long itemId) {
        return ApiResponse.<BuyItemResponse>builder()
                .code(1000)
                .result(service.buyItem(itemId))
                .build();
    }

    @PostMapping("/use-skip/{userItemId}")
    public ApiResponse<String> useSkip(@PathVariable Long userItemId) {
        return ApiResponse.<String>builder()
                .code(1000)
                .result(service.useSkip(userItemId))
                .build();
    }

    @PostMapping("/equip/avatar/{shopItemId}")
    public ApiResponse<String> equipAvatar(@PathVariable Long shopItemId) {
        return ApiResponse.<String>builder()
                .code(1000)
                .result(service.equipAvatar(shopItemId))
                .build();
    }

    @PostMapping("/equip/background/{shopItemId}")
    public ApiResponse<String> equipBackground(@PathVariable Long shopItemId) {
        return ApiResponse.<String>builder()
                .code(1000)
                .result(service.equipBackground(shopItemId))
                .build();
    }
}
