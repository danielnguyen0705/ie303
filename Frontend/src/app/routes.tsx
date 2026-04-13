import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Dashboard } from "./pages/Dashboard";
import { UnitView } from "./pages/UnitView";
import { UnitSelection } from "./pages/UnitSelection";
import { GradeUnits } from "./pages/GradeUnits";
import { SectionSelection } from "./pages/SectionSelection";
import { LessonSelection } from "./pages/LessonSelection";
import { LessonRunner } from "./pages/LessonRunner";
import { PronunciationExercise } from "./pages/exercises/PronunciationExercise";
import { ReadingExercise } from "./pages/exercises/ReadingExercise";
import { QuizExercise } from "./pages/exercises/QuizExercise";
import { ListeningExercise } from "./pages/exercises/ListeningExercise";
import { Leaderboard } from "./pages/Leaderboard";
import { Quests } from "./pages/Quests";
import { Profile } from "./pages/Profile";
import { Shop } from "./pages/Shop";
import { TestResults } from "./pages/TestResults";
import { TestReview } from "./pages/TestReview";
import { RevisionTest } from "./pages/RevisionTest";
import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UserManagement } from "./pages/admin/UserManagement";
import { ContentManagement } from "./pages/admin/ContentManagement";
import { QuestionBank } from "./pages/admin/QuestionBank";
import { Reports } from "./pages/admin/Reports";
import { VIPManagement } from "./pages/admin/VIPManagement";
import { Notifications } from "./pages/admin/Notifications";
import { Settings } from "./pages/admin/Settings";
import { ShopManagement } from "./pages/admin/ShopManagement";
import { RequireAuth } from "./components/RequireAuth";

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
          { path: "reports", Component: Reports },
          { path: "vip", Component: VIPManagement },
          { path: "shop", Component: ShopManagement },
          { path: "notifications", Component: Notifications },
          { path: "settings", Component: Settings },
        ],
      },
    ],
  },
]);