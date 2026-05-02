package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.UnitRequest;
import com.ie303.uifive.dto.res.UnitResponse;
import com.ie303.uifive.entity.Unit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UnitMapper {

    @Mapping(target = "gradeId", source = "grade.id")
    UnitResponse toResponse(Unit entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "grade", ignore = true)
    Unit toEntity(UnitRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "grade", ignore = true)
    void updateEntityFromRequest(UnitRequest request, @MappingTarget Unit entity);
}