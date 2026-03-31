package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.QuestionRequest;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionGroup;
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
}