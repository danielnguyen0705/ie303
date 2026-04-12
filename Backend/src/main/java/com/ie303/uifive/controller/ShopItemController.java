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
    public ShopItemResponse create(@ModelAttribute @Valid ShopItemRequest request) {
        return service.create(request);
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
    public ShopItemResponse update(@PathVariable Long id,
                                   @ModelAttribute @Valid ShopItemRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted shop item";
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
    public BuyItemResponse buyItem(@PathVariable Long itemId) {
        return service.buyItem(itemId);
    }

    @PostMapping("/use-skip/{userItemId}")
    public String useSkip(@PathVariable Long userItemId) {
        return service.useSkip(userItemId);
    }

    @PostMapping("/equip/avatar/{shopItemId}")
    public String equipAvatar(@PathVariable Long shopItemId) {
        return service.equipAvatar(shopItemId);
    }

    @PostMapping("/equip/background/{shopItemId}")
    public String equipBackground(@PathVariable Long shopItemId) {
        return service.equipBackground(shopItemId);
    }
}
