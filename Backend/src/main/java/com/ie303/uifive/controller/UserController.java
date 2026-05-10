package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.ChangePasswordRequest;
import com.ie303.uifive.dto.req.UpdateUserProfileRequest;
import com.ie303.uifive.dto.req.UserRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UserActivityCalendarResponse;
import com.ie303.uifive.dto.res.UserProfileResponse;
import com.ie303.uifive.dto.res.UserResponse;
import com.ie303.uifive.service.UserActivityService;
import com.ie303.uifive.service.UserService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@RolesAllowed({"USER", "ADMIN"})
public class UserController {

    private final UserService userService;
    private final UserActivityService userActivityService;

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getMyProfile(Authentication authentication) {

        String username = authentication.getName();

        return ApiResponse.<UserProfileResponse>builder()
                .code(1000)
                .result(userService.getMyProfile(username))
                .build();
    }

    @GetMapping("/me/activity-calendar")
    public ApiResponse<UserActivityCalendarResponse> getMyActivityCalendar(@RequestParam(required = false) Integer year,
                                                                           @RequestParam(required = false) Integer month,
                                                                           Authentication authentication) {
        String username = authentication.getName();

        return ApiResponse.<UserActivityCalendarResponse>builder()
                .code(1000)
                .result(userActivityService.getMyActivityCalendar(username, year, month))
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
    @PutMapping("/me")
    public ApiResponse<UserProfileResponse> updateProfile(@RequestBody @Valid UpdateUserProfileRequest request,
                                                          Authentication authentication) {

        String username = authentication.getName();

        return ApiResponse.<UserProfileResponse>builder()
                .code(1000)
                .message("Profile updated successfully")
                .result(userService.updateProfile(username, request))
                .build();
    }
    @GetMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<UserResponse> getById(@PathVariable Long id) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getById(id))
                .build();
    }

    @GetMapping
    @RolesAllowed("ADMIN")
    public ApiResponse<List<UserResponse>> getAll() {
        return ApiResponse.<List<UserResponse>>builder()
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
