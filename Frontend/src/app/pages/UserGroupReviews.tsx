import { getGroupReviewById, getGroupReviews } from "@/api";
import { PracticePackageRunner } from "@/app/components/PracticePackageRunner";
import type { GroupReviewResponse } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { hasVipAccess, loadQuestionBundle } from "./practicePackageData";

async function loadGroupReviewItems() {
  const response = await getGroupReviews();

  if (!response.success || !response.data) {
    return {
      items: [],
      error: response.error?.message || "Could not load group reviews.",
    };
  }

  return {
    items: response.data,
    error: null,
  };
}

async function loadGroupReviewPackage(
  item: GroupReviewResponse,
  includeVipLessons: boolean,
) {
  const response = await getGroupReviewById(item.id);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || "Could not load group review package.");
  }

  const bundle = await loadQuestionBundle({
    questionIds: response.data.questionIds,
    includeVipLessons,
  });

  return {
    selected: response.data,
    ...bundle,
  };
}

export function UserGroupReviews() {
  const { user } = useAuth();
  const includeVipLessons = hasVipAccess(user);

  return (
    <PracticePackageRunner<GroupReviewResponse>
      badgeLabel="VIP Group Review"
      pageTitle="Group Review Packages"
      pageDescription="These packages combine questions across multiple units. VIP users can reopen them and practice as one focused review test."
      packageKindLabel="Group Review"
      introText="Group reviews are built from a selected grade and unit span. Start one here to retake the whole package in a lesson-style runner."
      emptyListText="No group reviews available yet."
      emptyQuestionsText="This group review package has no questions yet."
      startButtonLabel="Start Group Review"
      loadItems={loadGroupReviewItems}
      loadPackage={(item) => loadGroupReviewPackage(item, includeVipLessons)}
      getItemMeta={(item) =>
        `Grade ${item.gradeId} - Units ${item.startUnit} to ${item.endUnit} - ${item.questionIds.length} question(s)`
      }
    />
  );
}
