package com.ie303.uifive.controller;

import com.ie303.uifive.dto.auth.LoginRequest;
import com.ie303.uifive.dto.auth.LoginResponse;
import com.ie303.uifive.dto.req.UserRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UserResponse;
import com.ie303.uifive.service.AuthService;
import com.ie303.uifive.service.UserService;
import com.ie303.uifive.security.AuthCookieUtil;
import jakarta.annotation.security.PermitAll;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
                                     HttpServletRequest httpRequest,
                                     HttpServletResponse response) {

        String token = authService.login(request);

        response.addHeader("Set-Cookie", AuthCookieUtil.buildAuthCookie(token, 86400, httpRequest));

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
    public ApiResponse<String> logout(HttpServletRequest httpRequest,
                                      HttpServletResponse response) {

        response.addHeader("Set-Cookie", AuthCookieUtil.buildAuthCookie("", 0, httpRequest));

        return ApiResponse.<String>builder()
                .code(1000)
                .message("Logout successful")
                .result("Logged out")
                .build();
    }

}
