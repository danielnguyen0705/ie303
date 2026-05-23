package com.ie303.uifive.dto.req;

import org.springframework.web.multipart.MultipartFile;

public record SubmitEssayImageRequest(
        Long questionId,
        String answerText,
        String imageUrl,
        MultipartFile imageFile
) {
}
