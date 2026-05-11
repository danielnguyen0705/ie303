import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Dashboard } from "./pages/Dashboard";
import { UnitView } from "./pages/UnitView";
import { UnitSelection } from "./pages/UnitSelection";
import { GradeUnits } from "./pages/GradeUnits";
import { SectionSelection } from "./pages/SectionSelection";
import { LessonSelection } from "./pages/LessonSelection";
import LessonRunner from "./pages/LessonRunner";
import { PronunciationExercise } from "./pages/exercises/PronunciationExercise";
import { ReadingExercise } from "./pages/exercises/ReadingExercise";
import { QuizExercise } from "./pages/exercises/QuizExercise";
import { ListeningExercise } from "./pages/exercises/ListeningExercise";
import { Leaderboard } from "./pages/Leaderboard";
import { Quests } from "./pages/Quests";
import { Profile } from "./pages/Profile";
import { Shop } from "./pages/Shop";
import { Topup } from "./pages/Topup";
import { PaymentHistory } from "./pages/PaymentHistory";
import { TestResults } from "./pages/TestResults";
import { TestReview } from "./pages/TestReview";
import { RevisionTest } from "./pages/RevisionTest";
import { PersonalizedQuestions } from "./pages/PersonalizedQuestions";
import { UserUnitReviews } from "./pages/UserUnitReviews";
import { UserGroupReviews } from "./pages/UserGroupReviews";
import { UserSemesterTests } from "./pages/UserSemesterTests";
import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UserManagement } from "./pages/admin/UserManagement";
import { ContentManagement } from "./pages/admin/ContentManagement";
import { QuestionBank } from "./pages/admin/QuestionBank";
// Unit/Group admin pages removed; use Lesson with isReviewLesson
import { SemesterTests } from "./pages/SemesterTests";
import { Reports } from "./pages/admin/Reports";
import { VIPManagement } from "./pages/admin/VIPManagement";
import { PaymentOffers } from "./pages/admin/PaymentOffers";
import { Notifications } from "./pages/admin/Notifications";
import { Settings } from "./pages/admin/Settings";
import { ShopManagement } from "./pages/admin/ShopManagement";
import { RequireAuth } from "./components/RequireAuth";
import { Forbidden } from "./pages/Forbidden";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },

      // New content flow
      { path: "grades/:gradeId/units", Component: GradeUnits },
      { path: "units/:unitId/sections", Component: SectionSelection },
      { path: "sections/:sectionId/lessons", Component: LessonSelection },
      { path: "lessons/:lessonId", Component: LessonRunner },

      // Old routes - keep temporarily for compatibility
      { path: "units", Component: UnitSelection },
      { path: "unit/:unitId", Component: UnitView },

      // Exercise demo routes
      { path: "exercise/pronunciation", Component: PronunciationExercise },
      { path: "exercise/reading", Component: ReadingExercise },
      { path: "exercise/quiz", Component: QuizExercise },
      { path: "exercise/listening", Component: ListeningExercise },

      { path: "test/results", Component: TestResults },
      { path: "test/review", Component: TestReview },
      { path: "test/revision", Component: RevisionTest },
      { path: "leaderboard", Component: Leaderboard },
      { path: "quests", Component: Quests },
      { path: "profile", Component: Profile },
      { path: "shop", Component: Shop },
      { path: "topup", Component: Topup },
      { path: "payment-history", Component: PaymentHistory },
      { path: "ai/personalized-questions", Component: PersonalizedQuestions },
      // user review routes kept here
      { path: "reviews/unit", Component: UserUnitReviews },
      { path: "reviews/group", Component: UserGroupReviews },
      { path: "tests/semester", Component: UserSemesterTests },
      { path: "403", Component: Forbidden },
      { path: "*", Component: NotFound },
    ],
  },
  {
    Component: RequireAuth,
    children: [
      {
        path: "/admin",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: "users", Component: UserManagement },
          { path: "content", Component: ContentManagement },
          { path: "questions", Component: QuestionBank },
          // Unit/Group review admin pages removed (use Lesson with isReviewLesson)
          { path: "semester-tests", Component: SemesterTests },
          { path: "reports", Component: Reports },
          { path: "vip", Component: VIPManagement },
          { path: "payments", Component: PaymentOffers },
          { path: "shop", Component: ShopManagement },
          { path: "notifications", Component: Notifications },
          { path: "settings", Component: Settings },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);
