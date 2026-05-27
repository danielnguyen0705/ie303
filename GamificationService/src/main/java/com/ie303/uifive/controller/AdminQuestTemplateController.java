package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.QuestTemplateRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.QuestTemplateResponse;
import com.ie303.uifive.entity.QuestPeriod;
import com.ie303.uifive.service.QuestTemplateService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/quest-templates")
@RequiredArgsConstructor
@RolesAllowed("ADMIN")
public class AdminQuestTemplateController {

    private final QuestTemplateService questTemplateService;

    @GetMapping
    public ApiResponse<List<QuestTemplateResponse>> getAll(
            @RequestParam(required = false) String period
    ) {
        List<QuestTemplateResponse> templates = questTemplateService.toResponseList(
                period == null || period.isBlank()
                        ? questTemplateService.getAllTemplates()
                        : questTemplateService.getAllTemplates().stream()
                        .filter(template -> template.getQuestPeriod() == QuestPeriod.valueOf(period.toUpperCase()))
                        .toList()
        );

        return ApiResponse.<List<QuestTemplateResponse>>builder()
                .code(1000)
                .result(templates)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<QuestTemplateResponse> getById(@PathVariable Long id) {
        return ApiResponse.<QuestTemplateResponse>builder()
                .code(1000)
                .result(questTemplateService.toResponse(questTemplateService.getById(id)))
                .build();
    }

    @PostMapping
    public ApiResponse<QuestTemplateResponse> create(@RequestBody @Valid QuestTemplateRequest request) {
        return ApiResponse.<QuestTemplateResponse>builder()
                .code(1000)
                .result(questTemplateService.toResponse(questTemplateService.create(request)))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<QuestTemplateResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid QuestTemplateRequest request
    ) {
        return ApiResponse.<QuestTemplateResponse>builder()
                .code(1000)
                .result(questTemplateService.toResponse(questTemplateService.update(id, request)))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deactivate(@PathVariable Long id) {
        questTemplateService.deactivate(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Quest template deactivated")
                .result("Quest template deactivated")
                .build();
    }
}
