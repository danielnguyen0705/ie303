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
        Object.fromEntries(
          response.data.map((grade) => [
            grade.id,
            grade.description ?? grade.name ?? grade.title ?? `Grade ${grade.id}`,
          ]),
        ),
      );
    };

    void loadGradeTitles();
  }, []);

  if (!includeVipLessons) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <section className="rounded-[1.75rem] border border-[#f5d39b] bg-[#fff8eb] p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d29b2a]">
            {copy("VIP only", "Chỉ dành cho VIP")}
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#8d5c06]">
            {copy("Semester tests are locked", "Bài kiểm tra học kỳ đang bị khóa")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8d5c06]">
            {copy(
              "Upgrade to VIP to open semester test packages and the questions inside them.",
              "Nâng cấp VIP để mở các gói kiểm tra học kỳ và làm các câu hỏi bên trong.",
            )}
          </p>
        </section>
      </main>
    );
  }

  return (
    <PracticePackageRunner<SemesterTestResponse>
      badgeLabel={copy("VIP Semester Test", "Bài kiểm tra học kỳ VIP")}
      pageTitle={copy("Semester Test Packages", "Goi kiem tra hoc ky")}
      pageDescription={copy(
        "Semester tests are larger mixed packages created by admin from question groups, standalone questions, and optional AI items.",
        "Bài kiểm tra học kỳ là gói lớn hơn do admin tạo từ nhóm câu hỏi, câu hỏi lẻ và câu hỏi AI nếu có.",
      )}
      packageKindLabel={copy("Semester Test", "Kiem tra hoc ky")}
      introText={copy(
        "Start a semester test package to work through the selected questions in one continuous runner. Review feedback will appear after you submit.",
        "Bắt đầu gói kiểm tra học kỳ để làm các câu hỏi đã chọn trong một runner liên tục. Nhận xét sẽ hiện sau khi bạn nộp bài.",
      )}
      emptyListText={copy("No semester tests available yet.", "Chưa có bài kiểm tra học kỳ nào.")}
      emptyQuestionsText={copy(
        "This semester test package has no questions yet.",
        "Gói kiểm tra học kỳ này chưa có câu hỏi.",
      )}
      startButtonLabel={copy("Start Semester Test", "Bat dau kiem tra hoc ky")}
      loadItems={loadSemesterTestItems}
      loadPackage={(item) => loadSemesterTestPackage(item, includeVipLessons)}
      getItemMeta={(item) =>
        `${gradeTitles[item.gradeId] ?? `${copy("Grade", "Lớp")} ${item.gradeId}`} - ${copy("Units", "Unit")} ${item.startUnit} ${copy("to", "đến")} ${item.endUnit} - ${item.timeLimit} ${copy("min", "phút")}`
      }
      getResultMeta={(item) =>
        `${copy("Question groups:", "Nhóm câu hỏi:")} ${item.questionGroupIds.length} - ${copy("Single questions:", "Câu hỏi lẻ:")} ${item.questionIds.length}`
      }
      preferredItemId={Number.isFinite(preferredItemId) && preferredItemId > 0 ? preferredItemId : null}
    />
  );
}
