package com.ie303.uifive.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class OpenApiConfig {

    public static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI uifiveOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("UIFive Backend API")
                        .description("Full API documentation for UIFive backend services.")
                        .version("v1")
                        .contact(new Contact()
                                .name("UIFive Team"))
                        .license(new License()
                                .name("Internal Use")))
                .components(new Components()
                        .addSecuritySchemes(
                                SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                        ));
    }

    @Bean
    public OpenApiCustomizer authRequirementCustomizer() {
        return openApi -> {
            if (openApi.getPaths() == null) {
                return;
            }

            openApi.getPaths().forEach((path, pathItem) -> {
                if (isPublicPath(path)) {
                    return;
                }

                addSecurity(pathItem.getGet());
                addSecurity(pathItem.getPost());
                addSecurity(pathItem.getPut());
                addSecurity(pathItem.getDelete());
                addSecurity(pathItem.getPatch());
                addSecurity(pathItem.getHead());
                addSecurity(pathItem.getOptions());
                addSecurity(pathItem.getTrace());
            });
        };
    }

    @Bean
    public OperationCustomizer roleAccessCustomizer() {
        return (operation, handlerMethod) -> {
            AccessInfo accessInfo = resolveAccessInfo(handlerMethod);

            if (accessInfo.isPublic()) {
                operation.setSecurity(new ArrayList<>());
            } else {
                addSecurity(operation);
            }

            if (!accessInfo.roles().isEmpty()) {
                operation.addExtension("x-required-roles", accessInfo.roles());
            }

            appendAccessDescription(operation, accessInfo);
            return operation;
        };
    }

    private static boolean isPublicPath(String path) {
        if (path == null || path.isBlank()) {
            return true;
        }

        return path.equals("/api/auth/login")
                || path.equals("/api/auth/register")
                || path.equals("/api/auth/verify-email")
                || path.startsWith("/oauth2/")
                || path.startsWith("/login/oauth2/")
                || path.startsWith("/api/payments/webhook");
    }

    private static AccessInfo resolveAccessInfo(HandlerMethod handlerMethod) {
        PermitAll methodPermitAll = handlerMethod.getMethodAnnotation(PermitAll.class);
        PermitAll classPermitAll = handlerMethod.getBeanType().getAnnotation(PermitAll.class);

        if (methodPermitAll != null || classPermitAll != null) {
            return new AccessInfo(true, List.of());
        }

        RolesAllowed methodRolesAllowed = handlerMethod.getMethodAnnotation(RolesAllowed.class);
        RolesAllowed classRolesAllowed = handlerMethod.getBeanType().getAnnotation(RolesAllowed.class);
        RolesAllowed rolesAllowed = methodRolesAllowed != null ? methodRolesAllowed : classRolesAllowed;

        if (rolesAllowed == null || rolesAllowed.value().length == 0) {
            return new AccessInfo(false, List.of());
        }

        List<String> roles = Arrays.stream(rolesAllowed.value())
                .filter(value -> value != null && !value.isBlank())
                .toList();

        return new AccessInfo(false, roles);
    }

    private static void appendAccessDescription(Operation operation, AccessInfo accessInfo) {
        String accessText;
        if (accessInfo.isPublic()) {
            accessText = "PUBLIC";
        } else if (!accessInfo.roles().isEmpty()) {
            accessText = "ROLE " + String.join(", ", accessInfo.roles());
        } else {
            accessText = "AUTHENTICATED";
        }

        String marker = "**Access:**";
        String existingDescription = operation.getDescription();
        if (existingDescription != null && existingDescription.contains(marker)) {
            return;
        }

        String accessLine = marker + " " + accessText;
        if (existingDescription == null || existingDescription.isBlank()) {
            operation.setDescription(accessLine);
            return;
        }

        operation.setDescription(existingDescription + "\n\n" + accessLine);
    }

    private static void addSecurity(Operation operation) {
        if (operation == null) {
            return;
        }

        List<SecurityRequirement> requirements = operation.getSecurity();
        if (requirements == null) {
            requirements = new ArrayList<>();
            operation.setSecurity(requirements);
        }

        boolean hasRequirement = requirements.stream()
                .anyMatch(requirement -> requirement.containsKey(SECURITY_SCHEME_NAME));
        if (!hasRequirement) {
            requirements.add(new SecurityRequirement().addList(SECURITY_SCHEME_NAME));
        }
    }

    private record AccessInfo(boolean isPublic, List<String> roles) {
    }
}
