package com.ie303.uifive.mapper;

import com.ie303.uifive.dto.req.GradeRequest;
import com.ie303.uifive.dto.res.GradeResponse;
import com.ie303.uifive.entity.Grade;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface GradeMapper {

    GradeResponse toResponse(Grade entity);

    // map create
    Grade toEntity(GradeRequest request);

    // map update (update entity cũ)
    void updateEntityFromRequest(GradeRequest request, @MappingTarget Grade entity);
}