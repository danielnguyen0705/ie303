package com.ie303.uifive.controller;

import com.ie303.uifive.dto.auth.LoginRequest;
import com.ie303.uifive.dto.auth.LoginResponse;
import com.ie303.uifive.dto.req.UserRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UserResponse;
import com.ie303.uifive.service.AuthService;
import com.ie303.uifive.service.UserService;
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
    public ApiResponse<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        String token = authService.login(request);

        return ApiResponse.<LoginResponse>builder()
                .code(1000)
                .message("Login successful")
                .result(new LoginResponse(token))
                .build();
    }

    @PostMapping("/register")
    public ApiResponse<UserResponse> create(@RequestBody @Valid UserRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(service.create(request))
                .build();
    }

    @GetMapping("/verify-email")
    public ApiResponse<String> verifyEmail(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ApiResponse.<String>builder()
                .code(1000)
                .result("Email verified successfully")
                .build();
    }
}
