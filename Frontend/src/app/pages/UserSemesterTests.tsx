import { getAllGrades, getSemesterTestById, getSemesterTests } from "@/api";
import { PracticePackageRunner } from "@/app/components/PracticePackageRunner";
import type { SemesterTestResponse } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { hasVipAccess, loadQuestionBundle } from "./practicePackageData";
import { useEffect, useState } from "react";
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
  const { copy } = useLanguage();
  const [searchParams] = useSearchParams();
  const includeVipLessons = hasVipAccess(user);
  const preferredItemId = Number(searchParams.get("testId"));
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
    <PracticePackageRunner<SemesterTestResponse>
      badgeLabel={copy("VIP Semester Test", "Bai kiem tra hoc ky VIP")}
      pageTitle={copy("Semester Test Packages", "Goi kiem tra hoc ky")}
      pageDescription={copy(
        "Semester tests are larger mixed packages created by admin from question groups, standalone questions, and optional AI items.",
        "Bai kiem tra hoc ky la goi lon hon do admin tao tu nhom cau hoi, cau hoi le va cau hoi AI neu co.",
      )}
      packageKindLabel={copy("Semester Test", "Kiem tra hoc ky")}
      introText={copy(
        "Start a semester test package to work through the selected questions in one continuous runner. Review feedback will appear after you submit.",
        "Bat dau goi kiem tra hoc ky de lam cac cau hoi da chon trong mot runner lien tuc. Nhan xet se hien sau khi ban nop bai.",
      )}
      emptyListText={copy("No semester tests available yet.", "Chua co bai kiem tra hoc ky nao.")}
      emptyQuestionsText={copy(
        "This semester test package has no questions yet.",
        "Goi kiem tra hoc ky nay chua co cau hoi.",
      )}
      startButtonLabel={copy("Start Semester Test", "Bat dau kiem tra hoc ky")}
      loadItems={loadSemesterTestItems}
      loadPackage={(item) => loadSemesterTestPackage(item, includeVipLessons)}
      getItemMeta={(item) =>
        `${gradeTitles[item.gradeId] ?? `${copy("Grade", "Lop")} ${item.gradeId}`} - ${copy("Units", "Unit")} ${item.startUnit} ${copy("to", "den")} ${item.endUnit} - ${item.timeLimit} ${copy("min", "phut")}`
      }
      getResultMeta={(item) =>
        `${copy("Question groups:", "Nhom cau hoi:")} ${item.questionGroupIds.length} - ${copy("Single questions:", "Cau hoi le:")} ${item.questionIds.length}`
      }
      preferredItemId={Number.isFinite(preferredItemId) && preferredItemId > 0 ? preferredItemId : null}
    />
  );
}
