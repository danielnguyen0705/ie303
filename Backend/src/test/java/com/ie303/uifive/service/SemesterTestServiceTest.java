package com.ie303.uifive.service;

import com.ie303.uifive.dto.res.SemesterTestResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.SemesterTest;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.mapper.SemesterTestMapper;
import com.ie303.uifive.repo.GradeRepo;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.QuestionGroupRepo;
import com.ie303.uifive.repo.QuestionOptionRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.SemesterTestRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SemesterTestServiceTest {

    @Mock
    private SemesterTestRepo repo;

    @Mock
    private GradeRepo gradeRepo;

    @Mock
    private QuestionRepo questionRepo;

    @Mock
    private QuestionGroupRepo questionGroupRepo;

    @Mock
    private SemesterTestMapper mapper;

    @Mock
    private UserService userService;

    @Mock
    private UserQuestionHistoryRepo userQuestionHistoryRepo;

    @Mock
    private LessonRepo lessonRepo;

    @Mock
    private QuestionOptionRepo questionOptionRepo;

    @InjectMocks
    private SemesterTestService semesterTestService;

    @Test
    void getById_ShouldReturnMappedQuestions() {
        User vipUser = new User();
        vipUser.setId(9L);
        vipUser.setRole(Role.USER);
        vipUser.setVipExpiredAt(LocalDateTime.now().plusDays(1));

        Grade grade = new Grade();
        grade.setId(6L);

        SemesterTest entity = new SemesterTest();
        entity.setId(2L);
        entity.setTitle("Semester test");
        entity.setStartUnit(4);
        entity.setEndUnit(6);
        entity.setTimeLimit(45);
        entity.setGrade(grade);

        SemesterTestResponse baseResponse = new SemesterTestResponse(
                2L,
                "Semester test",
                4,
                6,
                45,
                6L,
                List.of(101L),
                List.of(11L, 12L)
        );

        when(userService.getCurrentUser()).thenReturn(vipUser);
        when(repo.findById(2L)).thenReturn(Optional.of(entity));
        when(mapper.toResponse(entity)).thenReturn(baseResponse);
        SemesterTestResponse result = semesterTestService.getById(2L);

        assertEquals(List.of(11L, 12L), result.questionIds());
    }
}
