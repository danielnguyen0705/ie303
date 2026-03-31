package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.ChangePasswordRequest;
import com.ie303.uifive.dto.req.UserRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UserResponse;
import com.ie303.uifive.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserResponse> getMyInfo(Authentication authentication) {
        String username = authentication.getName();
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .message("Get info successful")
                .result(userService.getByUsername(username))
                .build();
    }
    @PutMapping("/me/change-password")
    public ApiResponse<String> changePassword(@RequestBody @Valid ChangePasswordRequest request,
                                              Authentication authentication) {

        String username = authentication.getName();

        userService.changePassword(username, request);

        return ApiResponse.<String>builder()
                .code(1000)
                .message("Password changed successfully")
                .result("OK")
                .build();
    }

}