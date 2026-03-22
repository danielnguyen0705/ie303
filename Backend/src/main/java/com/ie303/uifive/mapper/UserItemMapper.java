package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.UserItemRequest;
import com.ie303.uifive.dto.res.UserItemResponse;
import com.ie303.uifive.entity.UserItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserItemMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "itemId", source = "item.id")
    UserItemResponse toResponse(UserItem entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "item", ignore = true)
    UserItem toEntity(UserItemRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "item", ignore = true)
    void updateEntityFromRequest(UserItemRequest request, @MappingTarget UserItem entity);
}