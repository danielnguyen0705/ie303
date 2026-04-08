package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.QuestionGroupRequest;
import com.ie303.uifive.dto.res.QuestionGroupResponse;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.QuestionGroup;
import com.ie303.uifive.mapper.QuestionGroupMapper;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.QuestionGroupRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionGroupService {

    private final QuestionGroupRepo questionGroupRepo;
    private final LessonRepo lessonRepo;
    private final QuestionGroupMapper questionGroupMapper;

    public QuestionGroupResponse create(QuestionGroupRequest request) {
        QuestionGroup questionGroup = questionGroupMapper.toEntity(request);

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

    public void delete(Long id) {
        if (!questionGroupRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy QuestionGroup với id = " + id);
        }
        questionGroupRepo.deleteById(id);
    }
}