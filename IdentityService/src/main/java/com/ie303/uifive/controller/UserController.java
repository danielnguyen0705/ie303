package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.ChangePasswordRequest;
import com.ie303.uifive.dto.req.UpdateUserProfileRequest;
import com.ie303.uifive.dto.req.UserRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UserProfileResponse;
import com.ie303.uifive.dto.res.UserResponse;
import com.ie303.uifive.service.UserService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserProfileResponse> getMyProfile(Authentication authentication) {
        return ApiResponse.<UserProfileResponse>builder()
                .code(1000)
                .result(userService.getMyProfile(authentication.getName()))
                .build();
    }

    @PutMapping("/me/change-password")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<String> changePassword(@RequestBody @Valid ChangePasswordRequest request,
                                              Authentication authentication) {
        userService.changePassword(authentication.getName(), request);

        return ApiResponse.<String>builder()
                .code(1000)
                .message("Password changed successfully")
                .result("OK")
                .build();
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserProfileResponse> updateProfile(@RequestBody @Valid UpdateUserProfileRequest request,
                                                          Authentication authentication) {
        return ApiResponse.<UserProfileResponse>builder()
                .code(1000)
                .message("Profile updated successfully")
                .result(userService.updateProfile(authentication.getName(), request))
                .build();
    }

    @GetMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<UserResponse> getById(@PathVariable Long id) {
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .result(userService.getById(id))
                .build();
    }

    @GetMapping
    @RolesAllowed("ADMIN")
    public ApiResponse<List<UserResponse>> getAll() {
        return ApiResponse.<List<UserResponse>>builder()
                .code(1000)
                .result(userService.getAll())
                .build();
    }

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<UserResponse> updateByAdmin(@PathVariable Long id,
                                                   @RequestBody @Valid UserRequest request) {
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .result(userService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<String> deleteByAdmin(@PathVariable Long id) {
        userService.delete(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Deleted user")
                .result("Deleted user")
                .build();
    }
}
