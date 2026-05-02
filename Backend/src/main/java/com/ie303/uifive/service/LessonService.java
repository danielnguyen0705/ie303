package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.LessonRequest;
import com.ie303.uifive.dto.res.LessonResponse;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.Section;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.LessonMapper;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.SectionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepo lessonRepo;
    private final SectionRepo sectionRepo;
    private final LessonMapper lessonMapper;
    private final ContentDeletionService contentDeletionService;

    public LessonResponse create(LessonRequest request) {
        Lesson lesson = lessonMapper.toEntity(request);

        Section section = sectionRepo.findById(request.sectionId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        lesson.setSection(section);

        lesson = lessonRepo.save(lesson);

        LessonResponse response = lessonMapper.toResponse(lesson);
        return response;
    }

    public LessonResponse getById(Long id) {
        Lesson lesson = lessonRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

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
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

        lessonMapper.updateEntityFromRequest(request, lesson);

        Section section = sectionRepo.findById(request.sectionId())
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        lesson.setSection(section);

        lesson = lessonRepo.save(lesson);

        LessonResponse response = lessonMapper.toResponse(lesson);
        return response;
    }

    @Transactional
    public void delete(Long id) {
        if (!lessonRepo.existsById(id)) {
            throw new AppException(ErrorCode.LESSON_NOT_FOUND);
        }

        contentDeletionService.deleteLesson(id);
    }
}
