package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserRequest(
        @NotBlank(message = "username không được để trống")
        String username,

        @Email(message = "email không hợp lệ")
        String email,

        @NotBlank(message = "password không được để trống")
        String password,

        Role role // ADMIN / USER
) {
}