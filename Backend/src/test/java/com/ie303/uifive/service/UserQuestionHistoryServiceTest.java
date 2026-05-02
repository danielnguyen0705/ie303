package com.ie303.uifive.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ie303.uifive.dto.res.UserQuestionHistoryResponse;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserQuestionHistory;
import com.ie303.uifive.mapper.UserQuestionHistoryMapper;
import com.ie303.uifive.repo.QuestionOptionRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import com.ie303.uifive.repo.UserRepo;
import com.ie303.uifive.service.LearningProgressService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserQuestionHistoryServiceTest {

    @Mock
    private UserQuestionHistoryRepo historyRepo;

    @Mock
    private UserRepo userRepo;

    @Mock
    private QuestionRepo questionRepo;

    @Mock
    private QuestionOptionRepo questionOptionRepo;

    @Mock
    private UserQuestionHistoryMapper mapper;

    @Mock
    private LearningProgressService learningProgressService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private UserQuestionHistoryService historyService;

    @Test
    void getByUserId_ShouldReturnMappedRows() {
        UserQuestionHistory row1 = new UserQuestionHistory();
        row1.setId(2L);
        row1.setAnsweredAt(LocalDateTime.now());

        UserQuestionHistory row2 = new UserQuestionHistory();
        row2.setId(1L);
        row2.setAnsweredAt(LocalDateTime.now().minusMinutes(3));

        UserQuestionHistoryResponse res1 = new UserQuestionHistoryResponse(2L, "A", true, row1.getAnsweredAt(), 10L, 20L);
        UserQuestionHistoryResponse res2 = new UserQuestionHistoryResponse(1L, "B", false, row2.getAnsweredAt(), 10L, 21L);

        when(historyRepo.findByUserId(10L)).thenReturn(List.of(row1, row2));
        when(mapper.toResponse(row1)).thenReturn(res1);
        when(mapper.toResponse(row2)).thenReturn(res2);

        List<UserQuestionHistoryResponse> result = historyService.getByUserId(10L);

        assertEquals(2, result.size());
        assertEquals(2L, result.get(0).id());
        assertEquals(1L, result.get(1).id());
    }
}
