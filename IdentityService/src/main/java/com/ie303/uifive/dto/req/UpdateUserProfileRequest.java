package com.ie303.uifive.dto.req;

import jakarta.validation.constraints.Email;

public record UpdateUserProfileRequest(
        String username,
        @Email(message = "email không hợp lệ")
        String email,
        String avatar,
        String background
) {
}
