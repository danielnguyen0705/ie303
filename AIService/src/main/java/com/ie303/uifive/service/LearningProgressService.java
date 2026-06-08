package com.ie303.uifive.service;

import com.ie303.uifive.client.ProgressServiceClient;
import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.res.LessonProgressResponse;
import com.ie303.uifive.dto.res.SectionProgressResponse;
import com.ie303.uifive.dto.res.UnitProgressResponse;
import com.ie303.uifive.dto.res.UserLessonProgressResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LearningProgressService {

    private final ProgressServiceClient progressServiceClient;
    private final UserService userService;

    public UserLessonProgressResponse completeLesson(UserLessonProgressRequest request) {
        return progressServiceClient.completeLesson(request);
    }

    public List<UnitProgressResponse> getUnitsByGrade(Long gradeId) {
        return progressServiceClient.getUnitsByGrade(gradeId);
    }

    public List<SectionProgressResponse> getSectionsByUnit(Long unitId) {
        return progressServiceClient.getSectionsByUnit(unitId);
    }

    public List<LessonProgressResponse> getLessonsBySection(Long sectionId) {
        return progressServiceClient.getLessonsBySection(sectionId);
    }

    public List<LessonProgressResponse> getReviewLessonsBySection(Long sectionId) {
        return progressServiceClient.getReviewLessonsBySection(sectionId);
    }

    public String currentUserCacheKey() {
        var user = userService.getCurrentUser();
        return user.getId() + ":" + user.getRole() + ":" + user.getVipExpiredAt();
    }
}
