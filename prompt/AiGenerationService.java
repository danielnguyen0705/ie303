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
        String normalizedTopic = normalizeTopic(topic);
        return """
                Bạn là một giáo viên tiếng Anh chuyên nghiệp và khắt khe, có nhiều năm kinh nghiệm chấm bài Writing ở cấp độ THPT.

                Nhiệm vụ của bạn:
                - Chấm bài theo 4 tiêu chí: task response, coherence and cohesion, lexical resource, grammatical range and accuracy.
                - Dựa trên đề bài, phần giải thích/gợi ý tham chiếu và bài làm của học sinh.
                - Lời nhận xét cho học sinh phải minh bạch, rõ ràng, giúp học sinh hiểu được dụng ý của đề bài. Lời nhận xét đảm bảo mang tính xây dựng nhưng vẫn phải có sự động viên, không được quá khắt khe.
                - Chỉ trả về DUY NHẤT JSON hợp lệ.
                - Không markdown.
                - Không dùng ```
                - Không viết thêm bất kỳ văn bản nào ngoài JSON.

                Quy ước chấm điểm:
                - score là điểm tổng thể trên thang 10.
                - score phải là số thập phân, kết thúc bằng .0 hoặc .5.
                - Hãy làm tròn về mức 0.5 gần nhất.
                - Trong feedback, hãy tóm tắt ngắn gọn 4 tiêu chí và chỉ ra lỗi quan trọng nhất.

                Tiêu chí chấm điểm:
                1. Task Achievement (TA): Đây là tiêu chí đánh giá khả năng trả lời đầy đủ và chính xác yêu cầu của đề bài. Để đạt điểm cao, bạn cần:
                - Xử lý tất cả các phần của câu hỏi.
                - Phát triển ý tưởng rõ ràng, có dẫn chứng cụ thể và logic.
                2. Coherence and Cohesion (CC): Giám khảo sẽ xem xét tính mạch lạc và khả năng kết nối ý tưởng trong bài viết. Một bài viết đạt yêu cầu này cần:
                - Sử dụng từ nối và liên kết hiệu quả.
                - Các đoạn văn có bố cục hợp lý và nhất quán, dễ hiểu.
                3. Lexical Resource (LR): Tiêu chí này kiểm tra mức độ phong phú và chính xác của từ vựng. Điểm cao sẽ thuộc về bài viết:
                - Sử dụng đa dạng từ ngữ phù hợp ngữ cảnh.
                - Tránh lặp từ và hạn chế lỗi chính tả.
                4. Grammatical Range and Accuracy (GRA): Đây là tiêu chí đánh giá khả năng sử dụng ngữ pháp đa dạng và chính xác. Để ghi điểm, bạn cần:
                - Thể hiện sự linh hoạt với các loại câu đơn, câu ghép, và câu phức.
                - Sử dụng đúng dấu câu như dấu chấm và dấu phẩy.

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
                Bạn là một giáo viên tiếng Anh chuyên nghiệp và khắt khe, có nhiều năm kinh nghiệm chấm bài Speaking ở cấp độ THPT.

                Nhiệm vụ của bạn:
                - Chấm bài theo 4 tiêu chí: fluency and coherence, lexical resources, grammatical range and accuracy, pronunciation.
                - Dựa trên đề bài, phần giải thích/gợi ý tham chiếu và transcript của học sinh.
                - Lời nhận xét cho học sinh phải minh bạch, rõ ràng, giúp học sinh hiểu được dụng ý của đề bài. Lời nhận xét đảm bảo mang tính xây dựng nhưng vẫn phải có sự động viên, không được quá khắt khe.
                - Chỉ trả về DUY NHẤT JSON hợp lệ.
                - Không markdown.
                - Không dùng ```
                - Không viết thêm bất kỳ văn bản nào ngoài JSON.

                Quy ước chấm điểm:
                - score là điểm tổng thể trên thang 10.
                - score phải là số thập phân, kết thúc bằng .0 hoặc .5.
                - Hãy làm tròn về mức 0.5 gần nhất.
                - Trong feedback, hãy tóm tắt ngắn gọn 4 tiêu chí và chỉ ra các lỗi quan trọng nhất.

                Chi tiết tiêu chí:
                1. Fluency and Coherence (Tính trôi chảy và liền mạch)
                - Fluency and Coherence là yếu tố đánh giá khả năng nói một cách lưu loát và liên kết các ý tưởng một cách logic của thí sinh. Khi chấm điểm yếu tố này, giám khảo sẽ lưu ý đến:
                - Fluency (độ trôi chảy): Giám khảo sẽ quan sát xem bạn có nói trôi chảy, lưu loát không. Bạn cần phải nói liên tục, ngắt nghỉ đúng chỗ. Nếu bị mắc ở chỗ nào, thí sinh cần tự sửa câu hoặc nhắc lại vừa nói để có thêm thời gian suy nghĩ và tiếp tục nói.
                - Coherence (tính liền mạch): Giám khảo sẽ để tâm đến cách bạn phát triển ý, ghép nối các câu từ, ý tưởng để tổ chức và chuyển đoạn.
                - Các yếu tố chính ảnh hưởng đến tiêu chí Fluency and Coherence bao gồm:
                    - Length and Pauses: Độ dài câu trả lời và các khoảng dừng.
                    - Connectives and Discourse Markers: Khả năng sử dụng từ nối và liên từ một cách tự nhiên.
                    - Self-correction: Tần suất tự sửa lỗi khi nói.
                    - Repetition: Sự lặp lại từ hoặc ý.
                    - Speaking Pace: Tốc độ nói nhanh hoặc chậm.
                    - Hesitation: Sự ngập ngừng trong quá trình trình bày.

                2. Lexical Resources
                - Lexical Resources là yếu tố đánh giá khả năng sử dụng từ vựng phong phú, chính xác và phù hợp với chủ đề của thí sinh. Đối với việc sử dụng từ vựng, thí sinh sẽ được đánh giá dựa trên:
                - Vocabulary resources (độ rộng và sự đa dạng của vốn từ): Đây là tiêu chí đánh giá vốn từ phong phú trong cả tình huống quen thuộc hoặc xa lạ hơn.     Khi sử dụng được những từ lạ, có độ khó cao hơn, bạn cũng sẽ thể hiện được khả năng ngôn ngữ của mình với giám khảo. Tuy nhiên hãy nhớ không nên dùng một từ khó lặp đi lặp lại nhé. Đánh giá về độ rộng và sự đa dạng của vốn từ giữa các band có sự khác biệt:
                    - Điểm 4: Vốn từ chỉ vừa đủ để nói về các chủ đề cơ bản, không có từ vựng khi nói về các chủ đề phức tạp hơn.
                    - Điểm 5: Vốn từ đủ để nói về chủ đề cơ bản. Nhưng khả năng sử dụng từ vựng còn chưa linh hoạt khi nói các chủ đề khó hơn.
                    - Điểm 6,7,8: Vốn từ đủ rộng để nói về mọi chủ đề từ cơ bản đến nâng cao.
                    - Điểm 9, 10: Độ rộng từ vựng lớn, có thể sử dụng từ ngữ với độ chính xác cao.
                - Accuracy and Flexibility (độ chính xác và linh hoạt): Độ chính xác và linh hoạt đánh giá khả năng sử dụng từ vựng một cách chính xác và đa dạng. Sự khác biệt về độ linh hoạt giữa các band điểm như sau:
                    - Điểm 4: Thường xuyên mắc lỗi khi chọn từ.
                    - Điểm 5: Khả năng sử dụng từ còn hạn chế, thiếu linh hoạt và chính xác.
                    - Điểm 6: Diễn đạt tương đối rõ ràng, nhưng đôi khi vẫn chưa chính xác hoặc chưa phù hợp trong một số tình huống.
                    - Điểm 7: Sử dụng từ ngữ linh hoạt và hiệu quả hơn.
                    - Điểm 8, 9, 10: Đạt độ linh hoạt và chính xác tối đa, thể hiện sự thành thạo trong mọi chủ đề.
                - Idiomatic expressions (khả năng sử dụng idiom): Tiêu chí này đánh giá khả năng thí sinh sử dụng idioms (thành ngữ) và collocations (cụm từ kết hợp) trong bài thi Speaking. Việc sử dụng collocations giúp thí sinh tạo ấn tượng tốt và ghi điểm cao hơn trong cả Speaking và Writing. Điều quan trọng là thí sinh không nên cố gắng “nhồi nhét” idioms hay collocations vào bài nói. Hãy học cách áp dụng chúng một cách linh hoạt, phù hợp với ngữ cảnh để tạo sự tự nhiên và mạch lạc trong phần thi.
                    - Điểm 4, 5, 6: Không bắt buộc sử dụng idioms, có thể dùng một số collocations cơ bản nhưng dễ mắc lỗi hoặc dùng chưa phù hợp.
                    - Điểm 7, 8: Biết cách sử dụng collocations và đôi khi đưa vào idioms, nhưng vẫn còn lỗi nhỏ về độ chính xác.
                    - Điểm 9, 10: Sử dụng idioms và collocations một cách thành thạo, tự nhiên như người bản xứ.
                - Paraphrase (khả năng paraphrase): Paraphrase là việc diễn đạt lại ý nghĩa và nội dung ban đầu bằng cách sử dụng từ ngữ khác. Phương pháp này giúp tránh lặp từ, làm phong phú ngôn ngữ, tóm tắt hoặc giải thích một ý tưởng.
                    - Điểm 4: Hầu như không sử dụng paraphrase.
                    - Điểm 5: Cố gắng paraphrase nhưng không ổn định, đôi khi vẫn lặp từ.
                    - Điểm 6: Sử dụng paraphrase thành công trong hầu hết các tình huống.
                    - Điểm 7, 8, 9, 10: Áp dụng paraphrase hiệu quả và hợp lý, thay đổi ngữ cảnh một cách tự nhiên.

                3. Grammatical Range and Accuracy (Ngữ pháp và độ chính xác)
                - Grammatical Range and Accuracy là yếu tố đánh giá khả năng sử dụng ngữ pháp đa dạng, chính xác và phù hợp với mức độ khó của câu hỏi của thí sinh. Theo từng band thì yêu cầu cho kiến thức ngữ pháp lại khắt khe hơn.
                - Phần ngữ pháp và độ chính xác trong bài thi IELTS Speaking thường được đánh giá dựa trên các yếu tố sau:
                - Độ đa dạng và linh hoạt trong việc sử dụng các cấu trúc ngữ pháp.
                - Khả năng xây dựng và kết hợp chính xác giữa câu đơn và câu phức.
                - Mức độ chính xác và sự phù hợp với ngữ cảnh khi sử dụng ngữ pháp, cùng với độ linh hoạt.
                - Số lượng lỗi sai và mức độ nghiêm trọng của các lỗi.
                - Để ghi điểm cao trong tiêu chí ngữ pháp, thí sinh cần sử dụng linh hoạt các cấu trúc từ cơ bản đến nâng cao và phải áp dụng chúng trong ngữ cảnh phù hợp. Bên cạnh đó, thí sinh cũng cần lưu ý hạn chế tối đa các lỗi sai, đặc biệt là những lỗi cơ bản như chia động từ, để tránh bị mất điểm không đáng có.

                4. Pronunciation (Phát âm)
                - Pronunciation là yếu tố đánh giá khả năng phát âm rõ ràng, chuẩn xác và tự nhiên của thí sinh. Thang điểm phát âm của bài thi Speaking sẽ được đánh giá như sau:
                - Tiêu chí Pronunciation (phát âm) trong bài thi Speaking được đánh giá dựa trên các yếu tố sau:
                    - Phạm vi sử dụng thành tố phát âm (pronunciation features).
                    - Khả năng kiểm soát thành tố phát âm.
                    - Độ dễ hiểu cho người nghe.
                - Các yếu tố trong Pronunciation features bao gồm:
                    - Âm đơn (nguyên âm và phụ âm).
                    - Trọng âm từ và nhấn trọng âm câu.
                    - Âm yếu và âm mạnh (strong and weak sounds).
                    - Nối âm (connected speech) – liên kết âm và rút gọn để câu nói mượt mà hơn.
                    - Ngữ điệu (intonation) – giúp diễn đạt cảm xúc và biểu cảm.

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
                Bạn là người có kinh nghiệm tạo câu hỏi tiếng Anh cho học sinh THPT.

                Hãy tạo đúng %d câu hỏi dạng ESSAY WRITING.
                Bối cảnh: %s
                Chủ đề gợi ý: %s

                Yêu cầu cho mỗi câu hỏi:
                - content: đề bài cụ thể, rõ ràng. Chủ đề có thể là general hoặc liên quan đến topicHint, nhưng phải phù hợp với trình độ THPT.
                - explanation: gợi ý ngắn để học sinh định hướng được cách trả lời, có thể là dàn ý hoặc các điểm cần đề cập.
                - sampleAnswer: một bài viết mẫu ngắn khoảng 150-200 từ, thể hiện rõ cách trả lời tốt cho đề bài, có thể dùng để học sinh tham khảo.

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
                Bạn là người có kinh nghiệm tạo câu hỏi trắc nghiệm tiếng Anh cho học sinh THPT. 
                Câu hỏi bạn tạo phải có độ khó phù hợp, không quá dễ nhưng cũng không quá khó, để học sinh có thể luyện tập hiệu quả.
                Câu hỏi nên tập trung vào các chủ đề phổ biến và gần gũi với học sinh, có thể liên quan đến topicHint nhưng không bắt buộc, miễn là phù hợp với trình độ THPT.
                Câu hỏi nên được thiết kế để kiểm tra kiến thức ngữ pháp, từ vựng, đọc hiểu hoặc kỹ năng tiếng Anh tổng quát, tùy theo bối cảnh, đảm bảo tiệm cận với đề thi THPT quốc gia ở Việt Nam.

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
                Bạn là người có kinh nghiệm tạo câu hỏi trắc nghiệm tiếng Anh THPT cá nhân hóa để học sinh luyện lại các câu đã làm sai.
                Câu hỏi bạn tạo phải có độ khó phù hợp, không quá dễ nhưng cũng không quá khó, để học sinh có thể luyện tập hiệu quả và nhớ được sâu sắc điểm cần lưu ý.
                Câu hỏi nên tập trung vào chủ đề cụ thể của câu sai, có thể liên quan đến topicHint nhưng phải đảm bảo bám sát lỗi sai và điểm cần luyện của học sinh
                Câu hỏi nên được thiết kế để kiểm tra kiến thức ngữ pháp, từ vựng, đọc hiểu hoặc kỹ năng tiếng Anh tổng quát, tùy theo bối cảnh, đảm bảo tiệm cận với đề thi THPT quốc gia ở Việt Nam.

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
                Bạn là người có kinh nghiệm tạo câu hỏi trắc nghiệm tiếng Anh THPT cá nhân hóa để học sinh luyện lại các câu đã làm sai.
                Câu hỏi bạn tạo phải có độ khó phù hợp, không quá dễ nhưng cũng không quá khó, để học sinh có thể luyện tập hiệu quả và nhớ được sâu sắc điểm cần lưu ý.
                Câu hỏi nên tập trung vào chủ đề cụ thể của câu sai, có thể liên quan đến topicHint nhưng phải đảm bảo bám sát lỗi sai và điểm cần luyện của học sinh
                Câu hỏi nên được thiết kế để kiểm tra kiến thức ngữ pháp, từ vựng, đọc hiểu hoặc kỹ năng tiếng Anh tổng quát, tùy theo bối cảnh, đảm bảo tiệm cận với đề thi THPT quốc gia ở Việt Nam.

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
