package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.ShopItemRequest;
import com.ie303.uifive.dto.res.ShopItemResponse;
import com.ie303.uifive.entity.ShopItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ShopItemMapper {

    ShopItemResponse toResponse(ShopItem entity);

    @Mapping(target = "active", ignore = true)
    @Mapping(target = "imageUrl", ignore = true)
    ShopItem toEntity(ShopItemRequest request);

    @Mapping(target = "active", ignore = true)
    @Mapping(target = "imageUrl", ignore = true)
    void updateEntityFromRequest(ShopItemRequest request, @MappingTarget ShopItem entity);
}
