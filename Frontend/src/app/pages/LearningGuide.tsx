import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Lightbulb,
  Route,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "@/context/LanguageContext";

const guideSteps = [
  {
    icon: GraduationCap,
    titleEn: "Choose your grade",
    titleVi: "Chọn khối lớp",
    textEn:
      "Start with the grade you are studying so lessons match the Global Success textbook flow.",
    textVi:
      "Bắt đầu bằng khối lớp đang học để bài học khớp với mạch sách Global Success.",
  },
  {
    icon: Route,
    titleEn: "Follow unit order",
    titleVi: "Học theo thứ tự unit",
    textEn:
      "Move through units, sections, and lessons in order before jumping to review tests.",
    textVi:
      "Đi lần lượt qua unit, section và lesson trước khi chuyển sang các bài ôn tập.",
  },
  {
    icon: ClipboardList,
    titleEn: "Practice after each lesson",
    titleVi: "Luyện ngay sau bài học",
    textEn:
      "Do short exercises right away to lock in vocabulary, grammar, and reading skills.",
    textVi:
      "Làm bài luyện ngắn ngay sau khi học để ghi nhớ từ vựng, ngữ pháp và kỹ năng đọc.",
  },
  {
    icon: Trophy,
    titleEn: "Review and level up",
    titleVi: "Ôn tập và tăng cấp",
    textEn:
      "Use revision tests, quests, and leaderboard goals to keep your study rhythm alive.",
    textVi:
      "Dùng đề ôn, nhiệm vụ và mục tiêu bảng xếp hạng để giữ nhịp học đều.",
  },
];

const weeklyPlan = [
  {
    dayEn: "Mon - Tue",
    dayVi: "Thứ 2 - 3",
    focusEn: "Learn new lessons",
    focusVi: "Học bài mới",
    detailEn: "Finish 1-2 lessons and write down the newest grammar patterns.",
    detailVi: "Hoàn thành 1-2 bài và ghi lại cấu trúc ngữ pháp mới.",
  },
  {
    dayEn: "Wed - Thu",
    dayVi: "Thứ 4 - 5",
    focusEn: "Practice deeply",
    focusVi: "Luyện sâu",
    detailEn: "Redo missed questions and spend extra time on weak skills.",
    detailVi: "Làm lại câu sai và dành thêm thời gian cho kỹ năng còn yếu.",
  },
  {
    dayEn: "Fri",
    dayVi: "Thứ 6",
    focusEn: "Review the unit",
    focusVi: "Ôn lại unit",
    detailEn: "Take a short revision test and check your accuracy.",
    detailVi: "Làm bài ôn ngắn và kiểm tra độ chính xác.",
  },
  {
    dayEn: "Weekend",
    dayVi: "Cuối tuần",
    focusEn: "Recover streak",
    focusVi: "Giữ streak",
    detailEn: "Complete quests, collect coins, and preview next week's unit.",
    detailVi: "Hoàn thành nhiệm vụ, nhận coin và xem trước unit tuần sau.",
  },
];

const studyTips = [
  {
    icon: BrainCircuit,
    titleEn: "Fix mistakes first",
    titleVi: "Sửa lỗi trước",
    textEn:
      "Mistakes show exactly where to spend your next 10 minutes. Review them before starting something new.",
    textVi:
      "Câu sai cho biết 10 phút tiếp theo nên học gì. Hãy xem lại trước khi học nội dung mới.",
  },
  {
    icon: CalendarCheck,
    titleEn: "Keep sessions short",
    titleVi: "Học ngắn nhưng đều",
    textEn:
      "A focused 15-minute session every day beats one long session at the end of the week.",
    textVi:
      "Một buổi học tập trung 15 phút mỗi ngày hiệu quả hơn học dồn vào cuối tuần.",
  },
  {
    icon: Lightbulb,
    titleEn: "Turn answers into notes",
    titleVi: "Biến đáp án thành ghi chú",
    textEn:
      "After each exercise, save useful vocabulary and example sentences in your own words.",
    textVi:
      "Sau mỗi bài luyện, hãy ghi lại từ vựng và câu ví dụ bằng cách diễn đạt của bạn.",
  },
];

export function LearningGuide() {
  const { copy } = useLanguage();

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#f5f8fc] px-4 py-10 text-slate-900 md:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-10">
            <div className="flex flex-col justify-center">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
                <Sparkles className="h-4 w-4" />
                {copy("Learning Guide", "Cẩm nang học tập")}
              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                {copy(
                  "Build a steady English routine with UIFIVE.",
                  "Xây dựng lộ trình học tiếng Anh đều đặn cùng UIFIVE.",
                )}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                {copy(
                  "Use this guide to move from textbook lessons to focused practice, weekly reviews, and smart revision without losing your streak.",
                  "Dùng cẩm nang này để đi từ bài học trong SGK đến luyện tập trọng tâm, ôn tập theo tuần và giữ streak học tập.",
                )}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#155ca5] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#124d8c]"
                >
                  {copy("Start learning", "Bắt đầu học")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/test/revision"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-[#155ca5]/40 hover:text-[#155ca5]"
                >
                  {copy("Practice tests", "Luyện đề")}
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[#bfd8ff] bg-[#eef6ff] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-[#155ca5]">
                    {copy("Recommended rhythm", "Nhịp học gợi ý")}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    15-30 {copy("min/day", "phút/ngày")}
                  </h2>
                </div>
                <div className="rounded-xl bg-white p-3 text-[#155ca5] shadow-sm">
                  <Target className="h-7 w-7" />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  copy("Finish one lesson section", "Hoàn thành một phần bài học"),
                  copy("Redo missed questions", "Làm lại câu đã sai"),
                  copy("Take one quick review", "Làm một bài ôn nhanh"),
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#27ae60]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          {guideSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article
                key={step.titleEn}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-lg bg-[#155ca5]/10 p-3 text-[#155ca5]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-black text-slate-300">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-950">
                  {copy(step.titleEn, step.titleVi)}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {copy(step.textEn, step.textVi)}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-[#fed023]/30 p-3 text-[#9a7200]">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {copy("Weekly study plan", "Kế hoạch học theo tuần")}
                </h2>
                <p className="text-sm text-slate-600">
                  {copy(
                    "A simple rhythm for learners who want visible progress.",
                    "Một nhịp học đơn giản cho người muốn thấy tiến bộ rõ ràng.",
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {weeklyPlan.map((item) => (
                <div
                  key={item.dayEn}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-black text-[#155ca5]">
                      {copy(item.dayEn, item.dayVi)}
                    </h3>
                    <span className="text-sm font-bold text-slate-900">
                      {copy(item.focusEn, item.focusVi)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {copy(item.detailEn, item.detailVi)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-[#27ae60]/10 p-3 text-[#27ae60]">
                <BookOpenCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {copy("Study smarter", "Học thông minh hơn")}
                </h2>
                <p className="text-sm text-slate-600">
                  {copy(
                    "Small habits that make every UIFIVE session more useful.",
                    "Những thói quen nhỏ giúp mỗi buổi học UIFIVE hiệu quả hơn.",
                  )}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {studyTips.map((tip) => {
                const Icon = tip.icon;

                return (
                  <article
                    key={tip.titleEn}
                    className="rounded-xl bg-slate-50 p-5"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 text-[#155ca5] shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-black text-slate-950">
                        {copy(tip.titleEn, tip.titleVi)}
                      </h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      {copy(tip.textEn, tip.textVi)}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LearningGuide;
