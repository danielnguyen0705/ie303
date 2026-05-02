package com.ie303.uifive.dto.req;

import org.springframework.web.multipart.MultipartFile;

public record SubmitSpeakingRequest(
        Long questionId,
        String transcriptText,
        MultipartFile audioFile
) {
}
