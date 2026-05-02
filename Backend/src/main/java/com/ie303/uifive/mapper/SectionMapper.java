package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.SectionRequest;
import com.ie303.uifive.dto.res.SectionResponse;
import com.ie303.uifive.entity.Section;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SectionMapper {

    @Mapping(target = "unitId", source = "unit.id")
    SectionResponse toResponse(Section entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "unit", ignore = true)
    Section toEntity(SectionRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "unit", ignore = true)
    void updateEntityFromRequest(SectionRequest request, @MappingTarget Section entity);
}