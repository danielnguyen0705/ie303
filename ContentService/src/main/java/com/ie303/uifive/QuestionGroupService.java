package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.QuestionGroupRequest;
import com.ie303.uifive.dto.res.QuestionGroupResponse;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionGroup;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.QuestionGroupMapper;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.QuestionGroupRepo;
import com.ie303.uifive.repo.QuestionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
    private final CloudinaryService cloudinaryService;
    private final ContentDeletionService contentDeletionService;

    @CacheEvict(cacheNames = {
            "questions-by-id",
            "question-groups-by-id",
            "questions-by-lesson"
    }, allEntries = true)
    public QuestionGroupResponse create(QuestionGroupRequest request) {
        QuestionGroup questionGroup = questionGroupMapper.toEntity(request);
        applyMedia(questionGroup, request);

        if (request.lessonId() != null) {
            Lesson lesson = lessonRepo.findById(request.lessonId())
                    .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));
            questionGroup.setLesson(lesson);
        }

        questionGroup = questionGroupRepo.save(questionGroup);
        return questionGroupMapper.toResponse(questionGroup);
    }

    @Cacheable(cacheNames = "question-groups-by-id", key = "#id")
    public QuestionGroupResponse getById(Long id) {
        QuestionGroup questionGroup = questionGroupRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_GROUP_NOT_FOUND));
        return questionGroupMapper.toResponse(questionGroup);
    }

    public List<QuestionGroupResponse> getAll() {
        return questionGroupRepo.findAll().stream()
                .map(questionGroupMapper::toResponse)
                .toList();
    }

    @CacheEvict(cacheNames = {
            "questions-by-id",
            "question-groups-by-id",
            "questions-by-lesson"
    }, allEntries = true)
    public QuestionGroupResponse update(Long id, QuestionGroupRequest request) {
        QuestionGroup questionGroup = questionGroupRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_GROUP_NOT_FOUND));

        questionGroupMapper.updateEntityFromRequest(request, questionGroup);
        applyMedia(questionGroup, request);

        if (request.lessonId() != null) {
            Lesson lesson = lessonRepo.findById(request.lessonId())
                    .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));
            questionGroup.setLesson(lesson);
        } else {
            questionGroup.setLesson(null);
        }

        questionGroup = questionGroupRepo.save(questionGroup);
        return questionGroupMapper.toResponse(questionGroup);
    }

    @Transactional
    @CacheEvict(cacheNames = {
            "questions-by-id",
            "question-groups-by-id",
            "questions-by-lesson"
    }, allEntries = true)
    public void delete(Long id) {
        if (!questionGroupRepo.existsById(id)) {
            throw new AppException(ErrorCode.QUESTION_GROUP_NOT_FOUND);
        }

        contentDeletionService.deleteQuestionGroup(id);
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
