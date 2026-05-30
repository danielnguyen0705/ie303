package com.ie303.uifive.dto.req;

public record UserItemRequest(
        Long userId,
        Long itemId,
        int quantity
) {}