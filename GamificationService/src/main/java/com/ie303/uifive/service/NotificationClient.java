package com.ie303.uifive.service;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(
        name = "notificationClient",
        url = "${notification.service.base-url:http://localhost:8082}"
)
public interface NotificationClient {

    @PostMapping("/internal/notifications/shop-items/{itemId}/announce")
    void announceNewShopItem(@PathVariable("itemId") Long itemId);
}
