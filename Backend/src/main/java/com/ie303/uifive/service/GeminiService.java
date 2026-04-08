package com.ie303.uifive.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.ie303.uifive.dto.res.WritingEvaluationResponse;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GeminiService {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    private final ObjectMapper objectMapper;

    public WritingEvaluationResponse evaluateEssay(String topic, String explanation, String answerText) {
        int maxRetry = 3;
        int attempt = 0;

        while (attempt < maxRetry) {
            try {
                Client client = Client.builder()
                        .apiKey(apiKey)
                        .build();

                if (explanation == null || explanation.isBlank()) {
                    explanation = "Không có giải thích tham chiếu.";
                }

                String prompt = """
                    Bạn là giám khảo chấm bài viết tiếng Anh.

                    Hãy chấm bài essay của học sinh theo thang điểm từ 0 đến 10.

                    Bạn sẽ dựa trên:
                    - Đề bài
                    - Phần giải thích/gợi ý tham chiếu
                    - Bài làm của học sinh

                    Yêu cầu:
                    - Đánh giá mức độ phù hợp của bài làm với đề bài
                    - Dựa vào phần giải thích tham chiếu để nhận xét ý đúng, ý thiếu, cách diễn đạt
                    - Nhận xét bằng tiếng Việt, ngắn gọn, rõ ràng
                    - Chỉ trả về DUY NHẤT JSON hợp lệ
                    - Không markdown
                    - Không dùng ```
                    - Không viết thêm gì ngoài JSON

                    Đề bài:
                    %s

                    Giải thích tham chiếu:
                    %s

                    Bài làm của học sinh:
                    %s

                    Trả về đúng JSON theo format:
                    {
                      "score": 0.0,
                      "feedback": "string"
                    }
                    """.formatted(topic, explanation, answerText);

                GenerateContentResponse response = client.models.generateContent(
                        model,
                        prompt,
                        null
                );

                String raw = response.text();
                raw = raw.replace("```json", "")
                        .replace("```", "")
                        .trim();

                return objectMapper.readValue(raw, WritingEvaluationResponse.class);

            } catch (Exception e) {
                attempt++;

                if (attempt >= maxRetry) {
                    throw new AppException(ErrorCode.GEMINI_NOT_RESPONSE);
                }

                try {
                    Thread.sleep(2000); // nghỉ 2 giây rồi thử lại
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                }
            }
        }

        throw new AppException(ErrorCode.GEMINI_NOT_RESPONSE);
    }

    private String cleanJson(String raw) {
        if (raw == null) {
            return "";
        }

        return raw.replace("```json", "")
                .replace("```", "")
                .trim();
    }
}