import type { LessonDetail, Question, QuestionGroup } from "../api/content";
import { QuizExercise } from "../app/pages/exercises/QuizExercise";
import { ReadingExercise } from "../app/pages/exercises/ReadingExercise";
import { ListeningExercise } from "../app/pages/exercises/ListeningExercise";
import { PronunciationExercise } from "../app/pages/exercises/PronunciationExercise";
import { EmptyState } from "./EmptyState";

interface Props {
  detail: LessonDetail;
}

function detectType(
  questions: Question[],
  groups: QuestionGroup[],
): string | undefined {
  if (groups.length && groups[0]?.type) return groups[0].type;
  if (questions.length && questions[0]?.type) return questions[0].type;
  return undefined;
}

export function QuestionRenderer({ detail }: Props) {
  const type = detectType(detail.questions, detail.questionGroups);

  switch (type) {
    case "MULTIPLE_CHOICE":
    case "FILL_IN_BLANK":
    case "MATCHING":
    case "TRUE_FALSE":
    case "REORDER":
      return <QuizExercise />;

    case "READING":
      return <ReadingExercise />;

    case "LISTENING":
      return <ListeningExercise />;

    case "PRONUNCIATION":
      return <PronunciationExercise />;

    case "WRITING":
    case "SPEAKING":
      return (
        <EmptyState
          title="This lesson type is not available yet"
          description="Speaking and writing lessons will be added later."
        />
      );

    default:
      return (
        <EmptyState
          title="Unsupported lesson type"
          description="Cannot determine which UI should be rendered."
        />
      );
  }
}