package com.ie303.uifive.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ie303.uifive.dto.res.SpeakingEvaluationResponse;
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

    @Value("${nvidia.api-key:}")
    private String nvidiaApiKey;

    @Value("${nvidia.base-url:https://integrate.api.nvidia.com/v1}")
    private String nvidiaBaseUrl;

    @Value("${nvidia.text-model:meta/llama-3.1-8b-instruct}")
    private String nvidiaTextModel;

    @Value("${nvidia.vision-model:meta/llama-3.2-11b-vision-instruct}")
    private String nvidiaVisionModel;

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
        String raw = callChatModel(nvidiaTextModel, prompt, 512);
        return normalize(readJsonObject(raw, WritingEvaluationResponse.class));
    }

    public WritingEvaluationResponse evaluateEssay(String topic, String explanation, String answerText, String imageUrl) {
        validateConfiguration();
        validateEssayAnswer(answerText);

        String normalizedExplanation = (explanation == null || explanation.isBlank())
                ? "Không có giải thích tham chiếu."
                : explanation.trim();

        if (imageUrl == null || imageUrl.isBlank()) {
            return evaluateEssay(topic, explanation, answerText);
        }

        String prompt = buildEssayEvaluationPrompt(topic, normalizedExplanation, answerText)
                + """

                Hình ảnh bài làm của học sinh đã được đính kèm trong request.
                Hãy đọc cả hình ảnh và phần bài viết, rồi chấm điểm dựa trên toàn bộ nội dung.
                Nếu chữ viết tay khó đọc, hãy ghi rõ trong feedback.
                """;

        String raw = callVisionModel(prompt, imageUrl, 512);
        return normalize(readJsonObject(raw, WritingEvaluationResponse.class));
    }

    public SpeakingEvaluationResponse evaluateSpeaking(String topic, String explanation, String transcriptText) {
        validateConfiguration();
        if (transcriptText == null || transcriptText.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Transcript text is required");
        }

        String normalizedExplanation = (explanation == null || explanation.isBlank())
                ? "Không có giải thích tham chiếu."
                : explanation.trim();

        String prompt = buildSpeakingEvaluationPrompt(topic, normalizedExplanation, transcriptText.trim());
        String raw = callChatModel(nvidiaTextModel, prompt, 512);
        WritingEvaluationResponse result = normalize(readJsonObject(raw, WritingEvaluationResponse.class));
        return new SpeakingEvaluationResponse(result.score(), result.feedback(), transcriptText.trim(), null);
    }

    public List<GeneratedQuestionDraft> generateEssayQuestions(String context, int count, String topicHint) {
        validateConfiguration();
        int safeCount = normalizeCount(count);
        String prompt = buildEssayQuestionsPrompt(normalizeContext(context), safeCount, normalizeTopic(topicHint));
        return normalizeQuestionDrafts(readJsonArray(callChatModel(nvidiaTextModel, prompt, 1024),
                new TypeReference<List<GeneratedQuestionDraft>>() {
                }), safeCount);
    }

    public List<GeneratedMcqDraft> generateMcqQuestions(String context, int count, String topicHint) {
        validateConfiguration();
        int safeCount = normalizeCount(count);
        String prompt = buildMcqQuestionsPrompt(normalizeContext(context), safeCount, normalizeTopic(topicHint));
        return normalizeMcqDrafts(readJsonArray(callChatModel(nvidiaTextModel, prompt, 1024),
                new TypeReference<List<GeneratedMcqDraft>>() {
                }), safeCount);
    }

    public List<GeneratedMcqDraft> generatePersonalizedMcqQuestions(String context, int count, String topicHint) {
        validateConfiguration();
        int safeCount = normalizeCount(count);
        String prompt = buildPersonalizedMcqQuestionsPrompt(normalizeContext(context), safeCount, normalizeTopic(topicHint));
        return normalizeMcqDrafts(readJsonArray(callChatModel(nvidiaTextModel, prompt, 1024),
                new TypeReference<List<GeneratedMcqDraft>>() {
                }), safeCount);
    }

    public List<GeneratedPersonalizedQuestionDraft> generatePersonalizedQuestions(String context, int count, String topicHint) {
        validateConfiguration();
        int safeCount = normalizeCount(count);
        String prompt = buildPersonalizedMixedQuestionsPrompt(normalizeContext(context), safeCount, normalizeTopic(topicHint));
        return normalizePersonalizedDrafts(readJsonArray(callChatModel(nvidiaTextModel, prompt, 1024),
                new TypeReference<List<GeneratedPersonalizedQuestionDraft>>() {
                }), safeCount);
    }

    private String callChatModel(String model, String prompt, int maxTokens) {
        if (nvidiaApiKey == null || nvidiaApiKey.isBlank()) {
            throw new AppException(ErrorCode.AI_NOT_CONFIGURED);
        }

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.put("temperature", 0.2);
        body.put("max_tokens", maxTokens);

        ArrayNode messages = body.putArray("messages");
        ObjectNode message = messages.addObject();
        message.put("role", "user");
        message.put("content", prompt);

        return sendChatRequest(body);
    }

    private String callVisionModel(String prompt, String imageUrl, int maxTokens) {
        if (nvidiaApiKey == null || nvidiaApiKey.isBlank()) {
            throw new AppException(ErrorCode.AI_NOT_CONFIGURED);
        }

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", nvidiaVisionModel);
        body.put("temperature", 0.2);
        body.put("max_tokens", maxTokens);

        ArrayNode messages = body.putArray("messages");
        ObjectNode message = messages.addObject();
        message.put("role", "user");

        ArrayNode content = message.putArray("content");
        ObjectNode textPart = content.addObject();
        textPart.put("type", "text");
        textPart.put("text", prompt);

        ObjectNode imagePart = content.addObject();
        imagePart.put("type", "image_url");
        ObjectNode imageObject = imagePart.putObject("image_url");
        imageObject.put("url", imageUrl);

        return sendChatRequest(body);
    }

    private String sendChatRequest(ObjectNode body) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(trimTrailingSlash(nvidiaBaseUrl) + "/chat/completions"))
                    .timeout(Duration.ofSeconds(90))
                    .header("Authorization", "Bearer " + nvidiaApiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new AppException(ErrorCode.AI_NOT_RESPONSE, "NVIDIA HTTP " + response.statusCode() + ": " + truncate(response.body()));
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

            return content.trim();
        } catch (IOException | InterruptedException e) {
            throw new AppException(ErrorCode.AI_NOT_RESPONSE, e.getMessage());
        }
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
        return "PROMPT";
    }

    private String buildSpeakingEvaluationPrompt(String topic, String explanation, String transcriptText) {
        return "PROMPT";
    }

    private String buildEssayQuestionsPrompt(String context, int count, String topicHint) {
        return "PROMPT";
    }

    private String buildMcqQuestionsPrompt(String context, int count, String topicHint) {
        return "PROMPT";
    }

    private String buildPersonalizedMcqQuestionsPrompt(String context, int count, String topicHint) {
        return "PROMPT";
    }

    private String buildPersonalizedMixedQuestionsPrompt(String context, int count, String topicHint) {
        return "PROMPT";
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
        if (nvidiaApiKey == null || nvidiaApiKey.isBlank()) {
            throw new AppException(ErrorCode.AI_NOT_CONFIGURED, "NVIDIA API key is not configured");
        }
    }

    private void validateEssayAnswer(String answerText) {
        if (answerText == null || answerText.isBlank()) {
            throw new AppException(ErrorCode.INVALID_ESSAY_ANSWER);
        }
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "https://integrate.api.nvidia.com/v1";
        }

        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
