package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.GroupReviewRequest;
import com.ie303.uifive.dto.res.GroupReviewResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.GroupReview;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.mapper.GroupReviewMapper;
import com.ie303.uifive.repo.GradeRepo;
import com.ie303.uifive.repo.GroupReviewRepo;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.QuestionOptionRepo;
import com.ie303.uifive.repo.QuestionRepo;
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
class GroupReviewServiceTest {

    @Mock
    private GroupReviewRepo groupReviewRepo;

    @Mock
    private GradeRepo gradeRepo;

    @Mock
    private QuestionRepo questionRepo;

    @Mock
    private GroupReviewMapper mapper;

    @Mock
    private UserService userService;

    @Mock
    private LessonRepo lessonRepo;

    @Mock
    private QuestionOptionRepo questionOptionRepo;

    @InjectMocks
    private GroupReviewService groupReviewService;

    @Test
    void create_ShouldUseOnlyExplicitQuestionIds() {
        User vipUser = new User();
        vipUser.setId(7L);
        vipUser.setRole(Role.USER);
        vipUser.setVipExpiredAt(LocalDateTime.now().plusDays(1));

        Grade grade = new Grade();
        grade.setId(5L);

        Question baseQuestion = new Question();
        baseQuestion.setId(10L);

        GroupReview entity = new GroupReview();
        entity.setGrade(grade);
        entity.setQuestions(List.of(baseQuestion));

        GroupReviewResponse baseResponse = new GroupReviewResponse(1L, "Group review", 1, 3, 5L, List.of(10L));
        GroupReviewRequest request = new GroupReviewRequest("Group review", 1, 3, 5L, List.of(10L));

        when(userService.getCurrentUser()).thenReturn(vipUser);
        when(gradeRepo.findById(5L)).thenReturn(Optional.of(grade));
        when(mapper.toEntity(request)).thenReturn(entity);
        when(questionRepo.findAllById(List.of(10L))).thenReturn(List.of(baseQuestion));
        when(groupReviewRepo.save(entity)).thenReturn(entity);
        when(mapper.toResponse(entity)).thenReturn(baseResponse);

        GroupReviewResponse result = groupReviewService.create(request);

        assertEquals(List.of(10L), result.questionIds());
    }
}
