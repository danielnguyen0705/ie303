import { getUnitReviewById, getUnitReviews } from "@/api";
import { PracticePackageRunner } from "@/app/components/PracticePackageRunner";
import type { UnitReviewResponse } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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
  const { copy } = useLanguage();
  const [searchParams] = useSearchParams();
  const includeVipLessons = hasVipAccess(user);
  const preferredItemId = Number(searchParams.get("reviewId"));

  return (
    <PracticePackageRunner<UnitReviewResponse>
      badgeLabel={copy("Review Retake", "Lam lai on tap")}
      pageTitle={copy("Unit Review Packages", "Goi on tap Unit")}
      pageDescription={copy(
        "Admin prepares a unit review package. You reopen it here and practice again with the same question styles used in lessons.",
        "Admin chuan bi goi on tap unit. Ban co the mo lai tai day de luyen lai voi dung kieu cau hoi trong bai hoc.",
      )}
      packageKindLabel={copy("Review Pack", "Goi on tap")}
      introText={copy(
        "Start the package to retake questions in the same layout as the lesson runner. After you submit, each question will show its own correct or incorrect result.",
        "Bat dau goi de lam lai cau hoi theo bo cuc giong lesson runner. Sau khi nop, tung cau se hien ket qua dung hoac sai.",
      )}
      emptyListText={copy("No unit reviews available yet.", "Chua co goi on tap unit nao.")}
      emptyQuestionsText={copy(
        "This unit review package has no questions yet.",
        "Goi on tap unit nay chua co cau hoi.",
      )}
      startButtonLabel={copy("Start Review Test", "Bat dau bai on tap")}
      loadItems={loadUnitReviewItems}
      loadPackage={(item) => loadUnitReviewPackage(item, includeVipLessons)}
      getItemMeta={(item) =>
        `${copy("Unit ID", "Unit ID")} ${item.unitId} - ${item.questionIds.length} ${copy("question(s)", "cau hoi")}`
      }
      preferredItemId={Number.isFinite(preferredItemId) && preferredItemId > 0 ? preferredItemId : null}
    />
  );
}
