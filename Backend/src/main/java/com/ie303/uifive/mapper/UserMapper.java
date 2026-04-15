package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.UserRequest;
import com.ie303.uifive.dto.res.UserResponse;
import com.ie303.uifive.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "coin", ignore = true)
    @Mapping(target = "exp", ignore = true)
    @Mapping(target = "score", ignore = true)
    @Mapping(target = "streak", ignore = true)
    @Mapping(target = "lastStudyDate", ignore = true)
    @Mapping(target = "vipExpiredAt", ignore = true)
    @Mapping(target = "expBoostMultiplier", ignore = true)
    @Mapping(target = "expBoostExpiredAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    User toEntity(UserRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "coin", ignore = true)
    @Mapping(target = "exp", ignore = true)
    @Mapping(target = "score", ignore = true)
    @Mapping(target = "streak", ignore = true)
    @Mapping(target = "lastStudyDate", ignore = true)
    @Mapping(target = "vipExpiredAt", ignore = true)
    @Mapping(target = "expBoostMultiplier", ignore = true)
    @Mapping(target = "expBoostExpiredAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntityFromRequest(UserRequest request, @MappingTarget User entity);
}