package com.ie303.notificationservice.controller;

import com.ie303.notificationservice.dto.req.VerificationEmailRequest;
import com.ie303.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/shop-items/{itemId}/announce")
    public ResponseEntity<String> announceNewShopItem(@PathVariable Long itemId) {
        notificationService.announceNewShopItem(itemId);
        return ResponseEntity.accepted().body("Notification queued");
    }

    @PostMapping("/users/verification-email")
    public ResponseEntity<String> sendVerificationEmail(@RequestBody VerificationEmailRequest request) {
        notificationService.sendVerificationEmail(request.toEmail(), request.verifyLink());
        return ResponseEntity.accepted().body("Verification email queued");
    }
}
