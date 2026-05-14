import { getAllGrades, getGroupReviewById, getGroupReviews } from "@/api";
import { PracticePackageRunner } from "@/app/components/PracticePackageRunner";
import type { GroupReviewResponse } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { hasVipAccess, loadQuestionBundle } from "./practicePackageData";
import { useEffect, useState } from "react";

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
  const { copy } = useLanguage();
  const includeVipLessons = hasVipAccess(user);
  const [gradeTitles, setGradeTitles] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadGradeTitles = async () => {
      const response = await getAllGrades();
      if (!response.success || !response.data) {
        setGradeTitles({});
        return;
      }

      setGradeTitles(
        Object.fromEntries(response.data.map((grade) => [grade.id, grade.title])),
      );
    };

    void loadGradeTitles();
  }, []);

  return (
    <PracticePackageRunner<GroupReviewResponse>
      badgeLabel={copy("VIP Group Review", "On tap nhom VIP")}
      pageTitle={copy("Group Review Packages", "Goi on tap nhom")}
      pageDescription={copy(
        "These packages combine questions across multiple units. VIP users can reopen them and practice as one focused review test.",
        "Cac goi nay ket hop cau hoi tu nhieu unit. Tai khoan VIP co the mo lai va luyen nhu mot bai on tap tap trung.",
      )}
      packageKindLabel={copy("Group Review", "On tap nhom")}
      introText={copy(
        "Group reviews are built from a selected grade and unit span. Start one here to retake the whole package in a lesson-style runner.",
        "On tap nhom duoc tao tu khoi lop va khoang unit da chon. Bat dau tai day de lam lai ca goi theo kieu lesson runner.",
      )}
      emptyListText={copy("No group reviews available yet.", "Chua co goi on tap nhom nao.")}
      emptyQuestionsText={copy(
        "This group review package has no questions yet.",
        "Goi on tap nhom nay chua co cau hoi.",
      )}
      startButtonLabel={copy("Start Group Review", "Bat dau on tap nhom")}
      loadItems={loadGroupReviewItems}
      loadPackage={(item) => loadGroupReviewPackage(item, includeVipLessons)}
      getItemMeta={(item) =>
        `${gradeTitles[item.gradeId] ?? `${copy("Grade", "Lop")} ${item.gradeId}`} - ${copy("Units", "Unit")} ${item.startUnit} ${copy("to", "den")} ${item.endUnit} - ${item.questionIds.length} ${copy("question(s)", "cau hoi")}`
      }
    />
  );
}
