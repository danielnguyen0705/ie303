package com.ie303.uifive.dto.res;

import lombok.Data;

@Data
public class MLPredictionResponse {
    private String strongSkill;
    private String weakSkill;
    private String trendLabel;
}
