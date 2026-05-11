package com.ie303.uifive.controller;

import com.ie303.uifive.dto.auth.LoginRequest;
import com.ie303.uifive.dto.auth.LoginResponse;
import com.ie303.uifive.dto.req.UserRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UserResponse;
import com.ie303.uifive.service.AuthService;
import com.ie303.uifive.service.UserService;
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

        response.setHeader("Set-Cookie", buildAuthCookie(token, 86400, httpRequest));

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

        response.setHeader("Set-Cookie", buildAuthCookie("", 0, httpRequest));

        return ApiResponse.<String>builder()
                .code(1000)
                .message("Logout successful")
                .result("Logged out")
                .build();
    }

    private String buildAuthCookie(String token, int maxAgeSeconds, HttpServletRequest request) {
        boolean secure = isSecureRequest(request);
        String sameSite = secure ? "None" : "Lax";

        StringBuilder cookie = new StringBuilder("token=")
                .append(token == null ? "" : token)
                .append("; HttpOnly; Path=/; Max-Age=")
                .append(maxAgeSeconds)
                .append("; SameSite=")
                .append(sameSite);

        if (secure) {
            cookie.append("; Secure");
        }

        return cookie.toString();
    }

    private boolean isSecureRequest(HttpServletRequest request) {
        if (request.isSecure()) {
            return true;
        }

        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        return "https".equalsIgnoreCase(forwardedProto);
    }
}
