package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.UserSectionProgressRequest;
import com.ie303.uifive.dto.res.UserSectionProgressResponse;
import com.ie303.uifive.entity.UserSectionProgress;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserSectionProgressMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "sectionId", source = "section.id")
    UserSectionProgressResponse toResponse(UserSectionProgress entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "section", ignore = true)
    @Mapping(target = "completed", ignore = true)
    UserSectionProgress toEntity(UserSectionProgressRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "section", ignore = true)
    @Mapping(target = "completed", ignore = true)
    void updateEntityFromRequest(UserSectionProgressRequest request, @MappingTarget UserSectionProgress entity);
}