package com.ie303.uifive.dto.req;

import java.util.List;

public record ReviewCreationRequest(
    String title,
    List<Long> questionIds
) {}
