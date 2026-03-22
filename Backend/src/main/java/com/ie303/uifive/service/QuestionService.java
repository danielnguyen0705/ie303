package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.QuestionRequest;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.mapper.QuestionMapper;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.QuestionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepo questionRepo;
    private final LessonRepo lessonRepo;
    private final QuestionMapper questionMapper;

    public QuestionResponse create(QuestionRequest request) {
        Question question = questionMapper.toEntity(request);

        Lesson lesson = lessonRepo.findById(request.lessonId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Lesson với id = " + request.lessonId()));

        question.setLesson(lesson);

        question = questionRepo.save(question);

        QuestionResponse response = questionMapper.toResponse(question);
        return response;
    }

    public QuestionResponse getById(Long id) {
        Question question = questionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Question với id = " + id));

        QuestionResponse response = questionMapper.toResponse(question);
        return response;
    }

    public List<QuestionResponse> getAll() {
        List<Question> questions = questionRepo.findAll();

        List<QuestionResponse> responses = questions.stream()
                .map(questionMapper::toResponse)
                .toList();

        return responses;
    }

    public QuestionResponse update(Long id, QuestionRequest request) {
        Question question = questionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Question với id = " + id));

        questionMapper.updateEntityFromRequest(request, question);

        Lesson lesson = lessonRepo.findById(request.lessonId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Lesson với id = " + request.lessonId()));

        question.setLesson(lesson);

        question = questionRepo.save(question);

        QuestionResponse response = questionMapper.toResponse(question);
        return response;
    }

    public void delete(Long id) {
        if (!questionRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy Question với id = " + id);
        }

        questionRepo.deleteById(id);
    }
}