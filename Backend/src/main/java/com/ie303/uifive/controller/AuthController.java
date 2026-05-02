package com.ie303.uifive.controller;

import com.ie303.uifive.dto.auth.LoginRequest;
import com.ie303.uifive.dto.auth.LoginResponse;
import com.ie303.uifive.dto.req.UserRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UserResponse;
import com.ie303.uifive.service.AuthService;
import com.ie303.uifive.service.UserService;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService service;

    @PostMapping("/login")
        @PermitAll
    public ApiResponse<String> login(@RequestBody @Valid LoginRequest request,
                                     HttpServletResponse response) {

        String token = authService.login(request);

        response.setHeader(
                "Set-Cookie",
                "token=" + token + "; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax"
        );

        return ApiResponse.<String>builder()
                .code(1000)
                .message("Login successful")
                .result("Logged in successfully")
                .build();
    }

    @PostMapping("/register")
        @PermitAll
    public ApiResponse<UserResponse> create(@RequestBody @Valid UserRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(service.create(request))
                .build();
    }

    @GetMapping("/verify-email")
        @PermitAll
    public ApiResponse<String> verifyEmail(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ApiResponse.<String>builder()
                .code(1000)
                .result("Email verified successfully")
                .build();
    }

    @PostMapping("/logout")
        // @RolesAllowed({"USER", "ADMIN"})
    public ApiResponse<String> logout(HttpServletResponse response) {

        response.setHeader(
                "Set-Cookie",
                "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
        );

        return ApiResponse.<String>builder()
                .code(1000)
                .message("Logout successful")
                .result("Logged out")
                .build();
    }
}
