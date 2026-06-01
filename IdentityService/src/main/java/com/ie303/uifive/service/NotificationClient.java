package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.VerificationEmailRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "notification-service"
)
public interface NotificationClient {

    @PostMapping("/internal/notifications/users/verification-email")
    void sendVerificationEmail(@RequestBody VerificationEmailRequest request);
}
