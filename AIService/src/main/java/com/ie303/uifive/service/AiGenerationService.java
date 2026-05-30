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
        
        log.info("=== PERSONALIZED QUESTION GENERATION ===");
        log.info("Prompt length: {} chars", prompt.length());
        log.info("Requesting {} questions, max_tokens: 4096", safeCount);
        
        String rawResponse = callChatModel(nvidiaTextModel, prompt, 4096);  // Increased from 2048 to 4096
        log.info("Raw response length: {} chars", rawResponse.length());
        log.info("Raw response (first 500 chars): {}", rawResponse.substring(0, Math.min(500, rawResponse.length())) + "...");
        
        return normalizePersonalizedDrafts(readJsonArray(rawResponse,
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
                    .timeout(Duration.ofSeconds(120))  // Increased from 90 to 120 seconds
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
            String extracted = extractJsonArray(raw);
            log.debug("Extracted JSON array: {}", extracted.substring(0, Math.min(300, extracted.length())) + "...");
            
            T parsed = objectMapper.readValue(extracted, typeReference);
            if (parsed == null) {
                throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
            }
            log.debug("Successfully parsed {} items", parsed instanceof List ? ((List<?>) parsed).size() : 1);
            return parsed;
        } catch (AppException e) {
            log.error("AppException in readJsonArray: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Exception parsing JSON array: {}", e.getMessage());
            log.error("Raw response (full): {}", raw);
            log.error("Raw response length: {} chars", raw.length());
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE, "JSON Parse Error: " + e.getMessage());
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
            log.error("normalizePersonalizedDrafts: drafts is null or empty!");
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }

        log.debug("Normalizing {} personalized drafts...", drafts.size());
        List<GeneratedPersonalizedQuestionDraft> result = drafts.stream()
                .filter(draft -> {
                    if (draft == null) {
                        log.debug("  - Skipped: null draft");
                        return false;
                    }
                    if (draft.content() == null || draft.content().isBlank()) {
                        log.debug("  - Skipped: empty content");
                        return false;
                    }
                    log.debug("  ✓ Kept: {}", draft.content().substring(0, Math.min(50, draft.content().length())));
                    return true;
                })
                .limit(limit)
                .toList();
        
        log.debug("After normalization: {} valid drafts", result.size());
        return result;
    }

    private WritingEvaluationResponse normalize(WritingEvaluationResponse response) {
        if (response == null || response.feedback() == null || response.feedback().isBlank()) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }

        String feedback = response.feedback().trim();
        if (isPlaceholderEvaluation(feedback)) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }

        double score = Math.max(0, Math.min(10, response.score()));
        return new WritingEvaluationResponse(score, feedback);
    }

    private boolean isPlaceholderEvaluation(String feedback) {
        String normalized = feedback.toLowerCase();
        return normalized.contains("tổng quan...")
                || normalized.contains("task response...")
                || normalized.contains("coherence and cohesion...")
                || normalized.contains("lexical resource...")
                || normalized.contains("grammatical range and accuracy...")
                || normalized.contains("gợi ý cải thiện...");
    }

    private String buildEssayEvaluationPrompt(String topic, String explanation, String answerText) {
        String normalizedTopic = normalizeTopic(topic);
        return """
                Bạn là một giáo viên tiếng Anh chuyên nghiệp và khắt khe, có nhiều năm kinh nghiệm chấm bài Writing.

                Nhiệm vụ của bạn:
                - Chấm bài theo 4 tiêu chí: task response, coherence and cohesion, lexical resource, grammatical range and accuracy.
                - Dựa trên đề bài, phần giải thích/gợi ý tham chiếu và bài làm của học sinh.
                - Nhận xét phải công tâm, rõ ràng, có tính xây dựng nhưng không quá khắt khe.
                - Chỉ trả về DUY NHẤT JSON hợp lệ.
                - Không markdown.
                - Không dùng ```
                - Không viết thêm bất kỳ văn bản nào ngoài JSON.

                Quy ước chấm điểm:
                - score là điểm tổng thể trên thang 10.
                - score phải là số thập phân, kết thúc bằng .0 hoặc .5.
                - Hãy làm tròn về mức 0.5 gần nhất.
                - Trong feedback, hãy tóm tắt ngắn gọn 4 tiêu chí và chỉ ra lỗi quan trọng nhất.

                Gợi ý nội dung feedback:
                - Mở đầu bằng tổng quan 1-2 câu.
                - Nêu điểm mạnh và điểm yếu theo từng tiêu chí.
                - Kết thúc bằng 2-4 gợi ý hành động cụ thể để cải thiện.
                - Nếu có lỗi sai đáng chú ý, hãy nhắc lại nguyên văn một phần ngắn trong câu sai để học sinh nhận ra lỗi.

                Đề bài:
                %s

                Giải thích tham chiếu:
                %s

                Bài làm của học sinh:
                %s

                Trả về đúng JSON theo format:
                {
                  "score": 0.0,
                  "feedback": "Tổng quan...\\nTask response...\\nCoherence and cohesion...\\nLexical resource...\\nGrammatical range and accuracy...\\nGợi ý cải thiện..."
                }
                """.formatted(normalizedTopic, explanation, answerText);
    }

    private String buildSpeakingEvaluationPrompt(String topic, String explanation, String transcriptText) {
        String normalizedTopic = normalizeTopic(topic);
        return """
                Bạn là một giáo viên tiếng Anh chuyên nghiệp và khắt khe, có nhiều năm kinh nghiệm chấm bài Speaking.

                Nhiệm vụ của bạn:
                - Chấm bài theo 4 tiêu chí: fluency and coherence, lexical resources, grammatical range and accuracy, pronunciation.
                - Dựa trên đề bài, phần giải thích/gợi ý tham chiếu và transcript của học sinh.
                - Nhận xét phải công tâm, rõ ràng, có tính xây dựng nhưng không quá khắt khe.
                - Chỉ trả về DUY NHẤT JSON hợp lệ.
                - Không markdown.
                - Không dùng ```
                - Không viết thêm bất kỳ văn bản nào ngoài JSON.

                Quy ước chấm điểm:
                - score là điểm tổng thể trên thang 10.
                - score phải là số thập phân, kết thúc bằng .0 hoặc .5.
                - Hãy làm tròn về mức 0.5 gần nhất.
                - Trong feedback, hãy tóm tắt ngắn gọn 4 tiêu chí và chỉ ra lỗi quan trọng nhất.

                Gợi ý nội dung feedback:
                - Mở đầu bằng tổng quan 1-2 câu.
                - Nêu điểm mạnh và điểm yếu theo từng tiêu chí.
                - Nếu transcript có câu sai rõ ràng, hãy nhắc lại nguyên văn một phần ngắn trong câu sai.
                - Kết thúc bằng 2-4 gợi ý hành động cụ thể để luyện speaking tốt hơn.

                Đề bài:
                %s

                Giải thích tham chiếu:
                %s

                Transcript:
                %s

                Trả về đúng JSON theo format:
                {
                  "score": 0.0,
                  "feedback": "Tổng quan...\\nFluency and coherence...\\nLexical resources...\\nGrammatical range and accuracy...\\nPronunciation...\\nGợi ý cải thiện..."
                }
                """.formatted(normalizedTopic, explanation, transcriptText);
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
                    "content": "Choose the best answer to complete the sentence: She has been interested in science ____ she was a child.",
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
                    "content": "Choose the best answer to complete the sentence: She has been interested in science ____ she was a child.",
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
        // Truncate context if too long to avoid API cutoff
        String truncatedContext = context.length() > 800 
            ? context.substring(0, 800) + "..."
            : context;
            
        return """
                Generate %d English multiple-choice practice questions to help a student overcome their mistakes.
                
                Student Error History & Context:
                %s
                
                CRITICAL RULES:
                1. EACH question "content" MUST be a COMPLETE English sentence or paragraph with a blank/choice point.
                   Example: "My sister _____ to school every morning." or "Choose the correct word: 'She goes _____ work.'"
                2. Do NOT generate questions with just the instruction "Choose the best answer."
                3. Do NOT generate placeholder questions - all questions must be substantive English learning content.
                4. All questions MUST target the student's specific weak areas based on their error history.
                5. Question type: QUALITATIVE_MC only
                6. Each question has exactly 4 options (A/B/C/D) with exactly 1 correct answer.
                7. explanation: Brief English explanation of why the answer is correct.
                8. correctAnswer: The option key (A, B, C, or D) that is correct.
                9. Generate diverse question types: grammar, vocabulary, prepositions, articles, verb forms, etc.
                
                Return ONLY valid JSON array with NO markdown formatting:
                [
                  {
                    "questionType": "QUALITATIVE_MC",
                    "content": "Complete sentence or question with a blank/choice point in English",
                    "explanation": "Why this answer is correct",
                    "correctAnswer": "A",
                    "options": [
                      {"optionKey": "A", "content": "option content"},
                      {"optionKey": "B", "content": "option content"},
                      {"optionKey": "C", "content": "option content"},
                      {"optionKey": "D", "content": "option content"}
                    ]
                  }
                ]
                """.formatted(count, truncatedContext);
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
        
        if (start < 0) {
            throw new AppException(ErrorCode.AI_INVALID_RESPONSE);
        }
        
        if (end < start) {
            // JSON array is incomplete, try to fix it
            log.warn("JSON array is incomplete, attempting to close it");
            String partial = cleaned.substring(start);
            
            // Find the last complete object by looking for the last '}'
            int lastClose = partial.lastIndexOf('}');
            if (lastClose > 0) {
                log.debug("Found last complete object at position {}", lastClose);
                partial = partial.substring(0, lastClose + 1) + "]";
                return partial.trim();
            }
            
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
        return Math.max(1, Math.min(15, count));  // Reduced from 20 to 15 to avoid API token limits
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
