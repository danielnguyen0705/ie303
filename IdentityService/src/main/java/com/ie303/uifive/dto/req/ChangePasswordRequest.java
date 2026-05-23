package com.ie303.uifive.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "INVALID_PASSWORD")
        String oldPassword,

        @NotBlank(message = "INVALID_PASSWORD")
        @Size(min = 6, message = "INVALID_PASSWORD")
        String newPassword
) {
}
