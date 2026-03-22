package com.ie303.uifive.dto.res;

import lombok.Data;

import java.util.List;

@Data
public class UnitReviewResponse {

    private Long id;
    private String title;
    private Long unitId;
    private List<Long> questionIds;
}