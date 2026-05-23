package com.ie303.uifive.service;

import com.ie303.uifive.entity.GroupReview;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionGroup;
import com.ie303.uifive.entity.SemesterTest;
import com.ie303.uifive.entity.UnitReview;
import com.ie303.uifive.repo.AISpeakingEvaluationRepo;
import com.ie303.uifive.repo.AIWritingEvalutionRepo;
import com.ie303.uifive.repo.GroupReviewRepo;
import com.ie303.uifive.repo.GradeRepo;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.QuestionGroupRepo;
import com.ie303.uifive.repo.QuestionOptionRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.SectionRepo;
import com.ie303.uifive.repo.SemesterTestRepo;
import com.ie303.uifive.repo.UnitRepo;
import com.ie303.uifive.repo.UnitReviewRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContentDeletionService {

    private final QuestionRepo questionRepo;
    private final QuestionGroupRepo questionGroupRepo;
    private final QuestionOptionRepo questionOptionRepo;
    private final UserQuestionHistoryRepo userQuestionHistoryRepo;
    private final AIWritingEvalutionRepo aiWritingEvalutionRepo;
    private final AISpeakingEvaluationRepo aiSpeakingEvaluationRepo;
    private final UnitReviewRepo unitReviewRepo;
    private final GroupReviewRepo groupReviewRepo;
    private final SemesterTestRepo semesterTestRepo;
    private final LessonRepo lessonRepo;
    private final SectionRepo sectionRepo;
    private final UnitRepo unitRepo;
    private final GradeRepo gradeRepo;

    @Transactional
    public void deleteQuestion(Long questionId) {
        userQuestionHistoryRepo.deleteByQuestionIdIn(List.of(questionId));
        aiWritingEvalutionRepo.deleteByQuestionId(questionId);
        aiSpeakingEvaluationRepo.deleteByQuestionId(questionId);
        questionOptionRepo.deleteByQuestionId(questionId);

        detachQuestionFromUnitReviews(questionId);
        detachQuestionFromGroupReviews(questionId);
        detachQuestionFromSemesterTests(questionId);

        questionRepo.deleteById(questionId);
    }

    @Transactional
    public void deleteQuestionGroup(Long questionGroupId) {
        List<Question> questions = questionRepo.findByQuestionGroupId(questionGroupId);
        for (Question question : new ArrayList<>(questions)) {
            deleteQuestion(question.getId());
        }

        detachQuestionGroupFromGroupReviews(questionGroupId);
        detachQuestionGroupFromSemesterTests(questionGroupId);

        questionGroupRepo.deleteById(questionGroupId);
    }

    @Transactional
    public void deleteLesson(Long lessonId) {
        lessonRepo.deleteById(lessonId);
    }

    @Transactional
    public void deleteSection(Long sectionId) {
        lessonRepo.findBySectionId(sectionId).forEach(lessonRepo::delete);
        sectionRepo.deleteById(sectionId);
    }

    @Transactional
    public void deleteUnit(Long unitId) {
        sectionRepo.findByUnitIdOrderBySectionNumberAsc(unitId).forEach(section -> deleteSection(section.getId()));
        unitRepo.deleteById(unitId);
    }

    @Transactional
    public void deleteGrade(Long gradeId) {
        unitRepo.findByGradeIdOrderByUnitNumberAsc(gradeId).forEach(unit -> deleteUnit(unit.getId()));
        gradeRepo.deleteById(gradeId);
    }

    private void detachQuestionFromUnitReviews(Long questionId) {
        for (UnitReview unitReview : unitReviewRepo.findAll()) {
            if (unitReview.getQuestions() == null) {
                continue;
            }

            List<Question> updatedQuestions = unitReview.getQuestions().stream()
                    .filter(question -> !questionId.equals(question.getId()))
                    .toList();

            if (updatedQuestions.size() != unitReview.getQuestions().size()) {
                unitReview.setQuestions(updatedQuestions);
                unitReviewRepo.save(unitReview);
            }
        }
    }

    private void detachQuestionFromGroupReviews(Long questionId) {
        for (GroupReview groupReview : groupReviewRepo.findAll()) {
            if (groupReview.getQuestions() == null) {
                continue;
            }

            List<Question> updatedQuestions = groupReview.getQuestions().stream()
                    .filter(question -> !questionId.equals(question.getId()))
                    .toList();

            if (updatedQuestions.size() != groupReview.getQuestions().size()) {
                groupReview.setQuestions(updatedQuestions);
                groupReviewRepo.save(groupReview);
            }
        }
    }

    private void detachQuestionFromSemesterTests(Long questionId) {
        for (SemesterTest semesterTest : semesterTestRepo.findAll()) {
            if (semesterTest.getQuestions() == null) {
                continue;
            }

            List<Question> updatedQuestions = semesterTest.getQuestions().stream()
                    .filter(question -> !questionId.equals(question.getId()))
                    .toList();

            if (updatedQuestions.size() != semesterTest.getQuestions().size()) {
                semesterTest.setQuestions(updatedQuestions);
                semesterTestRepo.save(semesterTest);
            }
        }
    }

    private void detachQuestionGroupFromGroupReviews(Long questionGroupId) {
        for (GroupReview groupReview : groupReviewRepo.findAll()) {
            if (groupReview.getQuestionGroups() == null) {
                continue;
            }

            List<QuestionGroup> updatedQuestionGroups = groupReview.getQuestionGroups().stream()
                    .filter(questionGroup -> !questionGroupId.equals(questionGroup.getId()))
                    .toList();

            if (updatedQuestionGroups.size() != groupReview.getQuestionGroups().size()) {
                groupReview.setQuestionGroups(updatedQuestionGroups);
                groupReviewRepo.save(groupReview);
            }
        }
    }

    private void detachQuestionGroupFromSemesterTests(Long questionGroupId) {
        for (SemesterTest semesterTest : semesterTestRepo.findAll()) {
            if (semesterTest.getQuestionGroups() == null) {
                continue;
            }

            List<QuestionGroup> updatedQuestionGroups = semesterTest.getQuestionGroups().stream()
                    .filter(questionGroup -> !questionGroupId.equals(questionGroup.getId()))
                    .toList();

            if (updatedQuestionGroups.size() != semesterTest.getQuestionGroups().size()) {
                semesterTest.setQuestionGroups(updatedQuestionGroups);
                semesterTestRepo.save(semesterTest);
            }
        }
    }
}
