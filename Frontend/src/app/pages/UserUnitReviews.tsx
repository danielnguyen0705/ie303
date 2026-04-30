import { getUnitReviewById, getUnitReviews } from "@/api";
import { PracticePackageRunner } from "@/app/components/PracticePackageRunner";
import type { UnitReviewResponse } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { hasVipAccess, loadQuestionBundle } from "./practicePackageData";
import { useSearchParams } from "react-router";

async function loadUnitReviewItems() {
  const response = await getUnitReviews();

  if (!response.success || !response.data) {
    return {
      items: [],
      error: response.error?.message || "Could not load unit reviews.",
    };
  }

  return {
    items: response.data,
    error: null,
  };
}

async function loadUnitReviewPackage(
  item: UnitReviewResponse,
  includeVipLessons: boolean,
) {
  const response = await getUnitReviewById(item.id);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || "Could not load unit review package.");
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

export function UserUnitReviews() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const includeVipLessons = hasVipAccess(user);
  const preferredItemId = Number(searchParams.get("reviewId"));

  return (
    <PracticePackageRunner<UnitReviewResponse>
      badgeLabel="Review Retake"
      pageTitle="Unit Review Packages"
      pageDescription="Admin prepares a unit review package. You reopen it here and practice again with the same question styles used in lessons."
      packageKindLabel="Review Pack"
      introText="Start the package to retake questions in the same layout as the lesson runner. After you submit, each question will show its own correct or incorrect result."
      emptyListText="No unit reviews available yet."
      emptyQuestionsText="This unit review package has no questions yet."
      startButtonLabel="Start Review Test"
      loadItems={loadUnitReviewItems}
      loadPackage={(item) => loadUnitReviewPackage(item, includeVipLessons)}
      getItemMeta={(item) => `Unit ID ${item.unitId} - ${item.questionIds.length} question(s)`}
      preferredItemId={Number.isFinite(preferredItemId) && preferredItemId > 0 ? preferredItemId : null}
    />
  );
}
