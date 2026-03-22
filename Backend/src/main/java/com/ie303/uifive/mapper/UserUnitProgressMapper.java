package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.UserUnitProgressRequest;
import com.ie303.uifive.dto.res.UserUnitProgressResponse;
import com.ie303.uifive.entity.UserUnitProgress;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserUnitProgressMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "unitId", source = "unit.id")
    UserUnitProgressResponse toResponse(UserUnitProgress entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "unit", ignore = true)
    @Mapping(target = "completed", ignore = true)
    @Mapping(target = "unlockedAt", ignore = true)
    UserUnitProgress toEntity(UserUnitProgressRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "unit", ignore = true)
    @Mapping(target = "completed", ignore = true)
    @Mapping(target = "unlockedAt", ignore = true)
    void updateEntityFromRequest(UserUnitProgressRequest request, @MappingTarget UserUnitProgress entity);
}