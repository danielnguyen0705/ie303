package com.ie303.uifive.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.ie303.uifive.dto.res.WritingEvaluationResponse;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    private final ObjectMapper objectMapper;

        public record GeneratedQuestionDraft(
            String content,
            String explanation,
            String sampleAnswer
        ) {
        }

            public record GeneratedMcqOptionDraft(
                String optionKey,
                String content
            ) {
            }

            public record GeneratedMcqDraft(
                String content,
                String explanation,
                String correctOptionKey,
                List<GeneratedMcqOptionDraft> options
            ) {
            }

    public WritingEvaluationResponse evaluateEssay(String topic, String explanation, String answerText) {
        validateConfiguration();
        validateEssayAnswer(answerText);

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

                String raw = response == null ? null : response.text();
                String cleanedJson = extractJsonObject(raw);
                WritingEvaluationResponse parsed = objectMapper.readValue(cleanedJson, WritingEvaluationResponse.class);
                return normalize(parsed);

            } catch (Exception e) {
                attempt++;
                log.warn("Gemini attempt {} failed: {}", attempt, e.getMessage());

                if (attempt >= maxRetry) {
                    if (e instanceof AppException appException) {
                        throw appException;
                    }
                    throw new AppException(ErrorCode.GEMINI_NOT_RESPONSE);
                }

                try {
                    Thread.sleep(2000);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                }
            }
        }

        throw new AppException(ErrorCode.GEMINI_NOT_RESPONSE);
    }

    public List<GeneratedQuestionDraft> generateEssayQuestions(String context, int count, String topicHint) {
        validateConfiguration();

        int safeCount = Math.max(1, Math.min(20, count));
        String normalizedContext = (context == null || context.isBlank()) ? "English practice" : context.trim();
        String normalizedTopic = (topicHint == null || topicHint.isBlank()) ? "General" : topicHint.trim();

        int maxRetry = 3;
        int attempt = 0;

        while (attempt < maxRetry) {
            try {
                Client client = Client.builder()
                        .apiKey(apiKey)
                        .build();

                String prompt = """
                    Bạn là người tạo câu hỏi tiếng Anh cho học sinh.

                    Hãy tạo đúng %d câu hỏi dạng ESSAY WRITING.
                    Bối cảnh: %s
                    Chủ đề gợi ý: %s

                    Yêu cầu cho mỗi câu hỏi:
                    - content: đề bài cụ thể, rõ ràng
                    - explanation: gợi ý ngắn để học sinh biết hướng làm
                    - sampleAnswer: một đoạn trả lời mẫu ngắn

                    Chỉ trả về DUY NHẤT JSON hợp lệ là một ARRAY.
                    Không markdown.
                    Không dùng ```.
                    Không viết thêm gì ngoài JSON.

                    Format bắt buộc:
                    [
                      {
                        "content": "string",
                        "explanation": "string",
                        "sampleAnswer": "string"
                      }
                    ]
                    """.formatted(safeCount, normalizedContext, normalizedTopic);

                GenerateContentResponse response = client.models.generateContent(
                        model,
                        prompt,
                        null
                );

                String raw = response == null ? null : response.text();
                String cleaned = extractJsonArray(raw);
                List<GeneratedQuestionDraft> drafts = objectMapper.readValue(
                        cleaned,
                        new TypeReference<List<GeneratedQuestionDraft>>() {
                        }
                );

                if (drafts == null || drafts.isEmpty()) {
                    throw new AppException(ErrorCode.GEMINI_INVALID_RESPONSE);
                }

                return drafts.stream()
                        .filter(draft -> draft != null && draft.content() != null && !draft.content().isBlank())
                        .limit(safeCount)
                        .toList();
            } catch (Exception e) {
                attempt++;
                log.warn("Gemini generate questions attempt {} failed: {}", attempt, e.getMessage());

                if (attempt >= maxRetry) {
                    if (e instanceof AppException appException) {
                        throw appException;
                    }
                    throw new AppException(ErrorCode.GEMINI_NOT_RESPONSE);
                }

                try {
                    Thread.sleep(1500);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                }
            }
        }

        throw new AppException(ErrorCode.GEMINI_NOT_RESPONSE);
    }

    public List<GeneratedMcqDraft> generateMcqQuestions(String context, int count, String topicHint) {
        validateConfiguration();

        int safeCount = Math.max(1, Math.min(20, count));
        String normalizedContext = (context == null || context.isBlank()) ? "English practice" : context.trim();
        String normalizedTopic = (topicHint == null || topicHint.isBlank()) ? "General" : topicHint.trim();

        int maxRetry = 3;
        int attempt = 0;

        while (attempt < maxRetry) {
            try {
                Client client = Client.builder()
                        .apiKey(apiKey)
                        .build();

                String prompt = """
                    Bạn là người tạo câu hỏi trắc nghiệm tiếng Anh cho học sinh.

                    Hãy tạo đúng %d câu hỏi dạng multiple-choice.
                    Bối cảnh: %s
                    Chủ đề gợi ý: %s

                    Yêu cầu cho mỗi câu hỏi:
                    - content: nội dung câu hỏi
                    - explanation: giải thích ngắn
                    - options: đúng 4 lựa chọn A, B, C, D
                    - correctOptionKey: chỉ được là A/B/C/D

                    Chỉ trả về DUY NHẤT JSON hợp lệ là một ARRAY.
                    Không markdown.
                    Không dùng ```.
                    Không viết thêm gì ngoài JSON.

                    Format bắt buộc:
                    [
                      {
                        "content": "string",
                        "explanation": "string",
                        "correctOptionKey": "A",
                        "options": [
                          {"optionKey": "A", "content": "string"},
                          {"optionKey": "B", "content": "string"},
                          {"optionKey": "C", "content": "string"},
                          {"optionKey": "D", "content": "string"}
                        ]
                      }
                    ]
                    """.formatted(safeCount, normalizedContext, normalizedTopic);

                GenerateContentResponse response = client.models.generateContent(
                        model,
                        prompt,
                        null
                );

                String raw = response == null ? null : response.text();
                String cleaned = extractJsonArray(raw);
                List<GeneratedMcqDraft> drafts = objectMapper.readValue(
                        cleaned,
                        new TypeReference<List<GeneratedMcqDraft>>() {
                        }
                );

                if (drafts == null || drafts.isEmpty()) {
                    throw new AppException(ErrorCode.GEMINI_INVALID_RESPONSE);
                }

                List<GeneratedMcqDraft> normalizedDrafts = drafts.stream()
                        .filter(draft -> draft != null && draft.content() != null && !draft.content().isBlank())
                        .limit(safeCount)
                        .toList();

                if (normalizedDrafts.isEmpty()) {
                    throw new AppException(ErrorCode.GEMINI_INVALID_RESPONSE);
                }

                return normalizedDrafts;
            } catch (Exception e) {
                attempt++;
                log.warn("Gemini generate MCQ attempt {} failed: {}", attempt, e.getMessage());

                if (attempt >= maxRetry) {
                    if (e instanceof AppException appException) {
                        throw appException;
                    }
                    throw new AppException(ErrorCode.GEMINI_NOT_RESPONSE);
                }

                try {
                    Thread.sleep(1500);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                }
            }
        }

        throw new AppException(ErrorCode.GEMINI_NOT_RESPONSE);
    }

    private void validateConfiguration() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new AppException(ErrorCode.GEMINI_NOT_CONFIGURED);
        }
    }

    private void validateEssayAnswer(String answerText) {
        if (answerText == null || answerText.isBlank()) {
            throw new AppException(ErrorCode.INVALID_ESSAY_ANSWER);
        }
    }

    private String extractJsonObject(String raw) {
        String cleaned = cleanJson(raw);
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');

        if (start < 0 || end < start) {
            throw new AppException(ErrorCode.GEMINI_INVALID_RESPONSE);
        }

        return cleaned.substring(start, end + 1).trim();
    }

    private String extractJsonArray(String raw) {
        String cleaned = cleanJson(raw);
        int start = cleaned.indexOf('[');
        int end = cleaned.lastIndexOf(']');

        if (start < 0 || end < start) {
            throw new AppException(ErrorCode.GEMINI_INVALID_RESPONSE);
        }

        return cleaned.substring(start, end + 1).trim();
    }

    private WritingEvaluationResponse normalize(WritingEvaluationResponse response) {
        if (response == null || response.feedback() == null || response.feedback().isBlank()) {
            throw new AppException(ErrorCode.GEMINI_INVALID_RESPONSE);
        }

        double score = Math.max(0, Math.min(10, response.score()));
        return new WritingEvaluationResponse(score, response.feedback().trim());
    }

    private String cleanJson(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new AppException(ErrorCode.GEMINI_INVALID_RESPONSE);
        }

        return raw.replace("```json", "")
                .replace("```", "")
                .trim();
    }
}
