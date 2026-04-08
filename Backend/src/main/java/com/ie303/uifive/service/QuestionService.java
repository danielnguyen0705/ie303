package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.QuestionRequest;
import com.ie303.uifive.dto.res.LessonQuestionResponse;
import com.ie303.uifive.dto.res.QuestionGroupResponse;
import com.ie303.uifive.dto.res.QuestionOptionResponse;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionGroup;
import com.ie303.uifive.entity.QuestionOption;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.QuestionMapper;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.QuestionGroupRepo;
import com.ie303.uifive.repo.QuestionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepo questionRepo;
    private final LessonRepo lessonRepo;
    private final QuestionGroupRepo questionGroupRepo;
    private final QuestionMapper questionMapper;

    public QuestionResponse create(QuestionRequest request) {
        Question question = questionMapper.toEntity(request);

        if (request.lessonId() != null) {
            Lesson lesson = lessonRepo.findById(request.lessonId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Lesson với id = " + request.lessonId()));
            question.setLesson(lesson);
        }

        if (request.questionGroupId() != null) {
            QuestionGroup questionGroup = questionGroupRepo.findById(request.questionGroupId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy QuestionGroup với id = " + request.questionGroupId()));
            question.setQuestionGroup(questionGroup);
        }

        question = questionRepo.save(question);
        return questionMapper.toResponse(question);
    }

    public QuestionResponse getById(Long id) {
        Question question = questionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Question với id = " + id));
        return questionMapper.toResponse(question);
    }

    public List<QuestionResponse> getAll() {
        return questionRepo.findAll().stream()
                .map(questionMapper::toResponse)
                .toList();
    }

    public QuestionResponse update(Long id, QuestionRequest request) {
        Question question = questionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Question với id = " + id));

        questionMapper.updateEntityFromRequest(request, question);

        if (request.lessonId() != null) {
            Lesson lesson = lessonRepo.findById(request.lessonId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Lesson với id = " + request.lessonId()));
            question.setLesson(lesson);
        } else {
            question.setLesson(null);
        }

        if (request.questionGroupId() != null) {
            QuestionGroup questionGroup = questionGroupRepo.findById(request.questionGroupId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy QuestionGroup với id = " + request.questionGroupId()));
            question.setQuestionGroup(questionGroup);
        } else {
            question.setQuestionGroup(null);
        }

        question = questionRepo.save(question);
        return questionMapper.toResponse(question);
    }

    public void delete(Long id) {
        if (!questionRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy Question với id = " + id);
        }
        questionRepo.deleteById(id);
    }
    public LessonQuestionResponse getQuestionsByLesson(Long lessonId) {
        Lesson lesson = lessonRepo.findById(lessonId)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        List<QuestionResponse> questions = questionRepo
                .findByLessonIdAndQuestionGroupIsNullOrderByIdAsc(lessonId)
                .stream()
                .map(this::toQuestionResponse)
                .toList();

        List<QuestionGroupResponse> questionGroups = questionGroupRepo
                .findByLessonIdOrderByIdAsc(lessonId)
                .stream()
                .map(this::toQuestionGroupResponse)
                .toList();

        return new LessonQuestionResponse(
                lesson.getId(),
                questions,
                questionGroups
        );
    }

    private QuestionGroupResponse toQuestionGroupResponse(QuestionGroup group) {
        List<QuestionResponse> questions = group.getQuestions() == null
                ? List.of()
                : group.getQuestions().stream()
                .map(this::toQuestionResponse)
                .toList();

        return new QuestionGroupResponse(
                group.getId(),
                group.getGroupType(),
                group.getTitle(),
                group.getInstruction(),
                group.getSharedContent(),
                group.getAudioUrl(),
                group.getImageUrl(),
                group.getGroupData(),
                group.getLesson() != null ? group.getLesson().getId() : null,
                questions
        );
    }

    private QuestionResponse toQuestionResponse(Question question) {
        List<QuestionOptionResponse> options = question.getOptions() == null
                ? List.of()
                : question.getOptions().stream()
                .map(this::toQuestionOptionResponse)
                .toList();

        return new QuestionResponse(
                question.getId(),
                question.getQuestionType(),
                question.getContent(),
                question.getInstruction(),
                question.getAudioUrl(),
                question.getImageUrl(),
                question.getQuestionData(),
                question.getExplanation(),
                question.getLesson() != null ? question.getLesson().getId() : null,
                question.getQuestionGroup() != null ? question.getQuestionGroup().getId() : null,
                options
        );
    }

    private QuestionOptionResponse toQuestionOptionResponse(QuestionOption option) {
        return new QuestionOptionResponse(
                option.getId(),
                option.getOptionKey(),
                option.getContent(),
                option.isCorrect()
        );
    }
}