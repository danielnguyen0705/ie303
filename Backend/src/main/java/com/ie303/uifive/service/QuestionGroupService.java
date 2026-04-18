package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.QuestionGroupRequest;
import com.ie303.uifive.dto.res.QuestionGroupResponse;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionGroup;
import com.ie303.uifive.mapper.QuestionGroupMapper;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.QuestionGroupRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionGroupService {

    private final QuestionGroupRepo questionGroupRepo;
    private final LessonRepo lessonRepo;
    private final QuestionGroupMapper questionGroupMapper;
    private final QuestionRepo questionRepo;
    private final UserQuestionHistoryRepo userQuestionHistoryRepo;
    private final CloudinaryService cloudinaryService;

    public QuestionGroupResponse create(QuestionGroupRequest request) {
        QuestionGroup questionGroup = questionGroupMapper.toEntity(request);
        applyMedia(questionGroup, request);

        if (request.lessonId() != null) {
            Lesson lesson = lessonRepo.findById(request.lessonId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Lesson với id = " + request.lessonId()));
            questionGroup.setLesson(lesson);
        }

        questionGroup = questionGroupRepo.save(questionGroup);
        return questionGroupMapper.toResponse(questionGroup);
    }

    public QuestionGroupResponse getById(Long id) {
        QuestionGroup questionGroup = questionGroupRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy QuestionGroup với id = " + id));
        return questionGroupMapper.toResponse(questionGroup);
    }

    public List<QuestionGroupResponse> getAll() {
        return questionGroupRepo.findAll().stream()
                .map(questionGroupMapper::toResponse)
                .toList();
    }

    public QuestionGroupResponse update(Long id, QuestionGroupRequest request) {
        QuestionGroup questionGroup = questionGroupRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy QuestionGroup với id = " + id));

        questionGroupMapper.updateEntityFromRequest(request, questionGroup);
        applyMedia(questionGroup, request);

        if (request.lessonId() != null) {
            Lesson lesson = lessonRepo.findById(request.lessonId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Lesson với id = " + request.lessonId()));
            questionGroup.setLesson(lesson);
        } else {
            questionGroup.setLesson(null);
        }

        questionGroup = questionGroupRepo.save(questionGroup);
        return questionGroupMapper.toResponse(questionGroup);
    }

    @Transactional
    public void delete(Long id) {
        if (!questionGroupRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy QuestionGroup với id = " + id);
        }

        List<Question> questions = questionRepo.findByQuestionGroupId(id);
        if (!questions.isEmpty()) {
            List<Long> questionIds = questions.stream().map(Question::getId).toList();
            userQuestionHistoryRepo.deleteByQuestionIdIn(questionIds);
            questionRepo.deleteAll(questions);
        }
        questionGroupRepo.deleteById(id);
    }

    private void applyMedia(QuestionGroup questionGroup, QuestionGroupRequest request) {
        String uploadedAudioUrl = uploadIfPresent(request.audioFile(), "learning-app/question-groups/audio");
        if (uploadedAudioUrl != null) {
            questionGroup.setAudioUrl(uploadedAudioUrl);
        } else if (hasText(request.audioUrl())) {
            questionGroup.setAudioUrl(request.audioUrl().trim());
        }

        String uploadedImageUrl = uploadIfPresent(request.imageFile(), "learning-app/question-groups/images");
        if (uploadedImageUrl != null) {
            questionGroup.setImageUrl(uploadedImageUrl);
        } else if (hasText(request.imageUrl())) {
            questionGroup.setImageUrl(request.imageUrl().trim());
        }
    }

    private String uploadIfPresent(MultipartFile file, String folder) {
        return (file == null || file.isEmpty())
                ? null
                : cloudinaryService.uploadFile(file, folder);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}