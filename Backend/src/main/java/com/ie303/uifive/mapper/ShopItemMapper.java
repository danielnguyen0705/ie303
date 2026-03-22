package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.ShopItemRequest;
import com.ie303.uifive.dto.res.ShopItemResponse;
import com.ie303.uifive.entity.ShopItem;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ShopItemMapper {

    ShopItemResponse toResponse(ShopItem entity);

    ShopItem toEntity(ShopItemRequest request);

    void updateEntityFromRequest(ShopItemRequest request, @MappingTarget ShopItem entity);
}