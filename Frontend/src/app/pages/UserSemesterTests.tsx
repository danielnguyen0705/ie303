import { getSemesterTestById, getSemesterTests } from "@/api";
import { PracticePackageRunner } from "@/app/components/PracticePackageRunner";
import type { SemesterTestResponse } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { hasVipAccess, loadQuestionBundle } from "./practicePackageData";
import { useSearchParams } from "react-router";

async function loadSemesterTestItems() {
  const response = await getSemesterTests();

  if (!response.success || !response.data) {
    return {
      items: [],
      error: response.error?.message || "Could not load semester tests.",
    };
  }

  return {
    items: response.data,
    error: null,
  };
}

async function loadSemesterTestPackage(
  item: SemesterTestResponse,
  includeVipLessons: boolean,
) {
  const response = await getSemesterTestById(item.id);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || "Could not load semester test package.");
  }

  const bundle = await loadQuestionBundle({
    questionIds: response.data.questionIds,
    questionGroupIds: response.data.questionGroupIds,
    includeVipLessons,
  });

  return {
    selected: response.data,
    ...bundle,
  };
}

export function UserSemesterTests() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const includeVipLessons = hasVipAccess(user);
  const preferredItemId = Number(searchParams.get("testId"));

  return (
    <PracticePackageRunner<SemesterTestResponse>
      badgeLabel="VIP Semester Test"
      pageTitle="Semester Test Packages"
      pageDescription="Semester tests are larger mixed packages created by admin from question groups, standalone questions, and optional AI items."
      packageKindLabel="Semester Test"
      introText="Start a semester test package to work through the selected questions in one continuous runner. Review feedback will appear after you submit."
      emptyListText="No semester tests available yet."
      emptyQuestionsText="This semester test package has no questions yet."
      startButtonLabel="Start Semester Test"
      loadItems={loadSemesterTestItems}
      loadPackage={(item) => loadSemesterTestPackage(item, includeVipLessons)}
      getItemMeta={(item) =>
        `Grade ${item.gradeId} - Units ${item.startUnit} to ${item.endUnit} - ${item.timeLimit} min`
      }
      getResultMeta={(item) =>
        `Question groups: ${item.questionGroupIds.length} - Single questions: ${item.questionIds.length}`
      }
      preferredItemId={Number.isFinite(preferredItemId) && preferredItemId > 0 ? preferredItemId : null}
    />
  );
}
