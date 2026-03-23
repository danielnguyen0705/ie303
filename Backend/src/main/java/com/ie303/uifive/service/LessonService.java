package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.LessonRequest;
import com.ie303.uifive.dto.res.LessonResponse;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.Section;
import com.ie303.uifive.mapper.LessonMapper;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.SectionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepo lessonRepo;
    private final SectionRepo sectionRepo;
    private final LessonMapper lessonMapper;

    public LessonResponse create(LessonRequest request) {
        Lesson lesson = lessonMapper.toEntity(request);

        Section section = sectionRepo.findById(request.sectionId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Section với id = " + request.sectionId()));

        lesson.setSection(section);

        lesson = lessonRepo.save(lesson);

        LessonResponse response = lessonMapper.toResponse(lesson);
        return response;
    }

    public LessonResponse getById(Long id) {
        Lesson lesson = lessonRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Lesson với id = " + id));

        LessonResponse response = lessonMapper.toResponse(lesson);
        return response;
    }

    public List<LessonResponse> getAll() {
        List<Lesson> lessons = lessonRepo.findAll();

        List<LessonResponse> responses = lessons.stream()
                .map(lessonMapper::toResponse)
                .toList();

        return responses;
    }

    public LessonResponse update(Long id, LessonRequest request) {
        Lesson lesson = lessonRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Lesson với id = " + id));

        lessonMapper.updateEntityFromRequest(request, lesson);

        Section section = sectionRepo.findById(request.sectionId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Section với id = " + request.sectionId()));

        lesson.setSection(section);

        lesson = lessonRepo.save(lesson);

        LessonResponse response = lessonMapper.toResponse(lesson);
        return response;
    }

    public void delete(Long id) {
        if (!lessonRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy Lesson với id = " + id);
        }

        lessonRepo.deleteById(id);
    }
}