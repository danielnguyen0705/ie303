package com.ie303.uifive.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.ie303.uifive.dto.res.WritingEvaluationResponse;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiGenerationService {

    @Value("${ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${ai.openai.model:gpt-4o-mini}")
    private String openAiModel;

    @Value("${ai.anthropic.api-key:}")
    private String anthropicApiKey;

    @Value("${ai.anthropic.model:claude-3-5-sonnet-latest}")
    private String anthropicModel;

    @Value("${ai.anthropic.version:2023-06-01}")
    private String anthropicVersion;

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public record GeneratedQuestionDraft(String content, String explanation, String sampleAnswer) {
    }

    public record GeneratedMcqOptionDraft(String optionKey, String content) {
    }

    public record GeneratedMcqDraft(
            String content,
            String explanation,
            String correctOptionKey,
            List<GeneratedMcqOptionDraft> options
    ) {
    }

    public record GeneratedPersonalizedQuestionDraft(
            String questionType,
            String content,
            String explanation,
            String correctAnswer,
            List<GeneratedMcqOptionDraft> options
    ) {
    }

    public WritingEvaluationResponse evaluateEssay(String topic, String explanation, String answerText) {
        validateConfiguration();
        validateEssayAnswer(answerText);

        String normalizedExplanation = (explanation == null || explanation.isBlank())
                ? "Không có giải thích tham chiếu."
                : explanation.trim();

        String prompt = buildEssayEvaluationPrompt(topic, normalizedExplanation, answerText);
        String raw = generateWithFallback("evaluateEssay", prompt);
        return normalize(readJsonObject(raw, WritingEvaluationResponse.class));
    }

    public List<GeneratedQuestionDraft> generateEssayQuestions(String context, int count, String topicHint) {
        validateConfiguration();

        int safeCount = normalizeCount(count);
        String prompt = buildEssayQuestionsPrompt(normalizeContext(context), safeCount, normalizeTopic(topicHint));
        return normalizeQuestionDrafts(readJsonArray(
                generateWithFallback("generateEssayQuestions", prompt),
                new TypeReference<List<GeneratedQuestionDraft>>() {
                }
        ), safeCount);
    }

    public List<GeneratedMcqDraft> generateMcqQuestions(String context, int count, String topicHint) {
        validateConfiguration();

        int safeCount = normalizeCount(count);
        String prompt = buildMcqQuestionsPrompt(normalizeContext(context), safeCount, normalizeTopic(topicHint));
        return normalizeMcqDrafts(readJsonArray(
                generateWithFallback("generateMcqQuestions", prompt),
                new TypeReference<List<GeneratedMcqDraft>>() {
                }
        ), safeCount);
    }

    public List<GeneratedMcqDraft> generatePersonalizedMcqQuestions(String context, int count, String topicHint) {
        validateConfiguration();

        int safeCount = normalizeCount(count);
        String prompt = buildPersonalizedMcqQuestionsPrompt(normalizeContext(context), safeCount, normalizeTopic(topicHint));
        return normalizeMcqDrafts(readJsonArray(
                generateWithFallback("generatePersonalizedMcqQuestions", prompt),
                new TypeReference<List<GeneratedMcqDraft>>() {
                }
        ), safeCount);
    }

    public List<GeneratedPersonalizedQuestionDraft> generatePersonalizedQuestions(String context, int count, String topicHint) {
        validateConfiguration();

        int safeCount = normalizeCount(count);
        String prompt = buildPersonalizedMixedQuestionsPrompt(normalizeContext(context), safeCount, normalizeTopic(topicHint));
        return normalizePersonalizedDrafts(readJsonArray(
                generateWithFallback("generatePersonalizedQuestions", prompt),
                new TypeReference<List<GeneratedPersonalizedQuestionDraft>>() {
                }
        ), safeCount);
    }

    private String generateWithFallback(String operation, String prompt) {
        boolean sawAttempt = false;
        boolean sawInvalidResponse = false;
        StringBuilder failureSummary = new StringBuilder();

        for (AiProvider provider : AiProvider.values()) {
            if (!isConfigured(provider)) {
                continue;
            }

            sawAttempt = true;
            try {
                String raw = switch (provider) {
                    case OPENAI -> callOpenAi(prompt);
                    case ANTHROPIC -> callAnthropic(prompt);
                    case GEMINI -> callGemini(prompt);
                };

                if (raw == null || raw.isBlank()) {
                    throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
                }

                return raw;
            } catch (AppException e) {
                log.warn("{} via {} failed: {}", operation, provider.displayName, e.getMessage());
                appendFailure(failureSummary, provider.displayName, e.getMessage());
                if (e.getErrorCode() == ErrorCode.AI_INVALID_RESPONSE) {
                    sawInvalidResponse = true;
                }
            } catch (Exception e) {
                log.warn("{} via {} failed: {}", operation, provider.displayName, e.getMessage());
                appendFailure(failureSummary, provider.displayName, e.getMessage());
            }
        }

        if (sawInvalidResponse) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }

        if (sawAttempt) {
            String message = failureSummary.length() == 0
                    ? "AI providers are temporarily unavailable"
                    : "AI providers failed: " + failureSummary;
            throw new AppException(ErrorCode.AI_NOT_RESPONSE, message);
        }

        throw new AppException(ErrorCode.AI_NOT_CONFIGURED);
    }

    private String callOpenAi(String prompt) throws IOException, InterruptedException {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            throw new AppException(ErrorCode.AI_NOT_CONFIGURED);
        }

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", openAiModel);
        body.put("temperature", 0.2);
        ArrayNode messages = body.putArray("messages");
        ObjectNode message = messages.addObject();
        message.put("role", "user");
        message.put("content", prompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                .timeout(Duration.ofSeconds(45))
                .header("Authorization", "Bearer " + openAiApiKey)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new AppException(ErrorCode.AI_NOT_RESPONSE, "OpenAI HTTP " + response.statusCode() + ": " + truncate(response.body()));
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("choices")
                .path(0)
                .path("message")
                .path("content")
                .asText(null);

        if (content == null || content.isBlank()) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }

        return content;
    }

    private String callAnthropic(String prompt) throws IOException, InterruptedException {
        if (anthropicApiKey == null || anthropicApiKey.isBlank()) {
            throw new AppException(ErrorCode.AI_NOT_CONFIGURED);
        }

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", anthropicModel);
        body.put("max_tokens", 4096);
        body.put("temperature", 0.2);
        ArrayNode messages = body.putArray("messages");
        ObjectNode message = messages.addObject();
        message.put("role", "user");
        ArrayNode content = message.putArray("content");
        ObjectNode textBlock = content.addObject();
        textBlock.put("type", "text");
        textBlock.put("text", prompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.anthropic.com/v1/messages"))
                .timeout(Duration.ofSeconds(45))
                .header("x-api-key", anthropicApiKey)
                .header("anthropic-version", anthropicVersion)
                .header("content-type", "application/json")
                .header("accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new AppException(ErrorCode.AI_NOT_RESPONSE, "Anthropic HTTP " + response.statusCode() + ": " + truncate(response.body()));
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode contentNodes = root.path("content");
        StringBuilder builder = new StringBuilder();

        if (contentNodes.isArray()) {
            for (JsonNode node : contentNodes) {
                if ("text".equalsIgnoreCase(node.path("type").asText())) {
                    String text = node.path("text").asText("");
                    if (!text.isBlank()) {
                        builder.append(text);
                    }
                }
            }
        }

        String contentText = builder.toString().trim();
        if (contentText.isBlank()) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }

        return contentText;
    }

    private String callGemini(String prompt) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new AppException(ErrorCode.AI_NOT_CONFIGURED);
        }

        Client client = Client.builder()
                .apiKey(geminiApiKey)
                .build();

        GenerateContentResponse response = client.models.generateContent(geminiModel, prompt, null);
        String raw = response == null ? null : response.text();
        if (raw == null || raw.isBlank()) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }

        return raw;
    }

    private <T> T readJsonObject(String raw, Class<T> type) {
        try {
            T parsed = objectMapper.readValue(extractJsonObject(raw), type);
            if (parsed == null) {
                throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
            }
            return parsed;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }
    }

    private <T> T readJsonArray(String raw, TypeReference<T> typeReference) {
        try {
            T parsed = objectMapper.readValue(extractJsonArray(raw), typeReference);
            if (parsed == null) {
                throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
            }
            return parsed;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }
    }

    private List<GeneratedQuestionDraft> normalizeQuestionDrafts(List<GeneratedQuestionDraft> drafts, int limit) {
        if (drafts == null || drafts.isEmpty()) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }

        return drafts.stream()
                .filter(draft -> draft != null && draft.content() != null && !draft.content().isBlank())
                .limit(limit)
                .toList();
    }

    private List<GeneratedMcqDraft> normalizeMcqDrafts(List<GeneratedMcqDraft> drafts, int limit) {
        if (drafts == null || drafts.isEmpty()) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }

        return drafts.stream()
                .filter(draft -> draft != null && draft.content() != null && !draft.content().isBlank())
                .limit(limit)
                .toList();
    }

    private List<GeneratedPersonalizedQuestionDraft> normalizePersonalizedDrafts(
            List<GeneratedPersonalizedQuestionDraft> drafts,
            int limit
    ) {
        if (drafts == null || drafts.isEmpty()) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }

        return drafts.stream()
                .filter(draft -> draft != null && draft.content() != null && !draft.content().isBlank())
                .limit(limit)
                .toList();
    }

    private WritingEvaluationResponse normalize(WritingEvaluationResponse response) {
        if (response == null || response.feedback() == null || response.feedback().isBlank()) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }

        double score = Math.max(0, Math.min(10, response.score()));
        return new WritingEvaluationResponse(score, response.feedback().trim());
    }

    private String buildEssayEvaluationPrompt(String topic, String explanation, String answerText) {
        String normalizedTopic = normalizeTopic(topic);
        return """
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
                """.formatted(normalizedTopic, explanation, answerText);
    }

    private String buildEssayQuestionsPrompt(String context, int count, String topicHint) {
        return """
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
                Không dùng ```
                Không viết thêm gì ngoài JSON.

                Format bắt buộc:
                [
                  {
                    "content": "string",
                    "explanation": "string",
                    "sampleAnswer": "string"
                  }
                ]
                """.formatted(count, context, topicHint);
    }

    private String buildMcqQuestionsPrompt(String context, int count, String topicHint) {
        return """
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
                Không dùng ```
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
                """.formatted(count, context, topicHint);
    }

    private String buildPersonalizedMcqQuestionsPrompt(String context, int count, String topicHint) {
        return """
                Bạn là người tạo câu hỏi trắc nghiệm tiếng Anh để học sinh luyện lại các câu đã làm sai.

                Hãy tạo đúng %d câu hỏi dạng multiple-choice.
                Bối cảnh: %s
                Chủ đề gợi ý: %s

                Yêu cầu cực kỳ quan trọng:
                - Mỗi câu hỏi mới phải bám sát các "target answer", "target word", "target phrase" hoặc "target grammar point" có trong bối cảnh tham chiếu
                - Có thể đổi ngữ cảnh, ví dụ và cách hỏi, nhưng KHÔNG được đổi đáp án mục tiêu sang từ/cụm từ/kiến thức khác
                - Nếu tham chiếu ghi rõ target answer thì đáp án đúng của câu mới phải chính là target answer đó, hoặc kiểm tra trực tiếp đúng điểm kiến thức đó
                - Không tạo câu hỏi chung chung, không lạc sang từ vựng khác
                - Ưu tiên giúp học sinh luyện lại đúng lỗi cũ bằng một câu mới dễ hiểu hơn

                Yêu cầu cho mỗi câu hỏi:
                - content: nội dung câu hỏi
                - explanation: giải thích ngắn, nêu rõ vì sao đáp án đúng khớp với target cần luyện
                - options: đúng 4 lựa chọn A, B, C, D
                - correctOptionKey: chỉ được là A/B/C/D

                Chỉ trả về DUY NHẤT JSON hợp lệ là một ARRAY.
                Không markdown.
                Không dùng ```
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
                """.formatted(count, context, topicHint);
    }

    private String buildPersonalizedMixedQuestionsPrompt(String context, int count, String topicHint) {
        return """
                Bạn là người tạo bộ câu hỏi tiếng Anh cá nhân hóa để học sinh luyện lại đúng các lỗi đã làm sai.

                Hãy tạo đúng %d câu hỏi.
                Bối cảnh: %s
                Chủ đề gợi ý: %s

                Bạn CHỈ được dùng các questionType có trong phần "Allowed personalized question types" của bối cảnh.

                Yêu cầu cực kỳ quan trọng:
                - Phải ưu tiên tạo bộ câu hỏi HỖN HỢP nhiều loại nếu bối cảnh cho phép, không dồn toàn bộ về 1 dạng
                - Nhưng vẫn phải bám sát "target answer" hoặc điểm kiến thức gốc từ câu sai tham chiếu
                - Không đổi sang kiến thức khác
                - Nếu câu mới là dạng option-based thì đáp án đúng phải nằm đúng trong options
                - Nếu câu mới là dạng fill/form thì correctAnswer phải là đáp án text cuối cùng học sinh cần điền

                Các questionType được phép trong JSON:
                - QUALITATIVE_MC
                - CLOZE_MC
                - LIMITED_FILL
                - WORD_FORM
                - VERB_FORM

                Quy tắc format:
                - Với QUALITATIVE_MC, CLOZE_MC:
                  questionType phải đúng tên
                  options phải có đúng 4 lựa chọn A, B, C, D
                  correctAnswer phải là optionKey đúng: A/B/C/D
                - Với LIMITED_FILL, WORD_FORM, VERB_FORM:
                  options phải là [] hoặc null
                  correctAnswer phải là text đáp án đúng

                Chỉ trả về DUY NHẤT JSON hợp lệ là một ARRAY.
                Không markdown.
                Không dùng ```
                Không viết thêm gì ngoài JSON.

                Format bắt buộc:
                [
                  {
                    "questionType": "QUALITATIVE_MC",
                    "content": "string",
                    "explanation": "string",
                    "correctAnswer": "A",
                    "options": [
                      {"optionKey": "A", "content": "string"},
                      {"optionKey": "B", "content": "string"},
                      {"optionKey": "C", "content": "string"},
                      {"optionKey": "D", "content": "string"}
                    ]
                  },
                  {
                    "questionType": "WORD_FORM",
                    "content": "string",
                    "explanation": "string",
                    "correctAnswer": "string",
                    "options": []
                  }
                ]
                """.formatted(count, context, topicHint);
    }

    private String extractJsonObject(String raw) {
        String cleaned = cleanJson(raw);
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start < 0 || end < start) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }
        return cleaned.substring(start, end + 1).trim();
    }

    private String extractJsonArray(String raw) {
        String cleaned = cleanJson(raw);
        int start = cleaned.indexOf('[');
        int end = cleaned.lastIndexOf(']');
        if (start < 0 || end < start) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }
        return cleaned.substring(start, end + 1).trim();
    }

    private String cleanJson(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }

        return raw.replace("```json", "")
                .replace("```", "")
                .trim();
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }

        String cleaned = value.replaceAll("\\s+", " ").trim();
        return cleaned.length() <= 400 ? cleaned : cleaned.substring(0, 400) + "...";
    }

    private void appendFailure(StringBuilder failureSummary, String providerName, String message) {
        if (failureSummary.length() > 0) {
            failureSummary.append(" | ");
        }

        failureSummary.append(providerName).append(": ").append(truncate(message));
    }

    private int normalizeCount(int count) {
        return Math.max(1, Math.min(20, count));
    }

    private String normalizeContext(String context) {
        return (context == null || context.isBlank()) ? "English practice" : context.trim();
    }

    private String normalizeTopic(String topicHint) {
        return (topicHint == null || topicHint.isBlank()) ? "General" : topicHint.trim();
    }

    private void validateConfiguration() {
        if (isConfigured(AiProvider.OPENAI) || isConfigured(AiProvider.ANTHROPIC) || isConfigured(AiProvider.GEMINI)) {
            return;
        }

        throw new AppException(ErrorCode.AI_NOT_CONFIGURED);
    }

    private void validateEssayAnswer(String answerText) {
        if (answerText == null || answerText.isBlank()) {
            throw new AppException(ErrorCode.INVALID_ESSAY_ANSWER);
        }
    }

    private boolean isConfigured(AiProvider provider) {
        return switch (provider) {
            case OPENAI -> openAiApiKey != null && !openAiApiKey.isBlank();
            case ANTHROPIC -> anthropicApiKey != null && !anthropicApiKey.isBlank();
            case GEMINI -> geminiApiKey != null && !geminiApiKey.isBlank();
        };
    }

    private enum AiProvider {
        OPENAI("ChatGPT"),
        ANTHROPIC("Claude"),
        GEMINI("Gemini");

        private final String displayName;

        AiProvider(String displayName) {
            this.displayName = displayName;
        }
    }
}
