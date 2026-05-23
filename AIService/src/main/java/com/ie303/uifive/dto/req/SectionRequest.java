package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.SectionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SectionRequest(
        @NotNull(message = "sectionNumber khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
        Integer sectionNumber,

        @NotBlank(message = "title khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
        String title,

        @NotNull(message = "sectionType khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
        SectionType sectionType,

        Integer orderIndex,

        @NotNull(message = "unitId khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
        Long unitId
) {
}
