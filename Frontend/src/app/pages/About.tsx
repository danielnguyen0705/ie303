import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  GraduationCap,
  HeartHandshake,
  Rocket,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "@/context/LanguageContext";

const values = [
  {
    icon: BookOpenCheck,
    titleEn: "Textbook aligned",
    titleVi: "Bám sát sách giáo khoa",
    textEn:
      "Lessons follow the Global Success flow so learners can study online without drifting away from school goals.",
    textVi:
      "Bài học đi theo mạch Global Success để học sinh học online nhưng vẫn bám sát mục tiêu trên lớp.",
  },
  {
    icon: Trophy,
    titleEn: "Motivation built in",
    titleVi: "Có động lực trong từng bước",
    textEn:
      "Coins, streaks, quests, and leaderboards turn consistent practice into a habit learners want to keep.",
    textVi:
      "Coin, streak, nhiệm vụ và bảng xếp hạng giúp việc luyện tập đều đặn trở thành thói quen dễ duy trì.",
  },
  {
    icon: BrainCircuit,
    titleEn: "Smarter practice",
    titleVi: "Luyện tập thông minh hơn",
    textEn:
      "Practice, review, and personalized questions help learners spend time on the skills that need attention.",
    textVi:
      "Bài luyện, ôn tập và câu hỏi cá nhân hóa giúp học sinh tập trung vào kỹ năng cần cải thiện.",
  },
];

const stats = [
  {
    value: "10-12",
    labelEn: "High school grades",
    labelVi: "Khối THPT",
  },
  {
    value: "15-30",
    labelEn: "Recommended minutes/day",
    labelVi: "Phút học mỗi ngày",
  },
  {
    value: "4",
    labelEn: "Core learning loops",
    labelVi: "Vòng học cốt lõi",
  },
];

const loops = [
  {
    icon: GraduationCap,
    titleEn: "Learn",
    titleVi: "Học",
    textEn: "Start from grade, unit, section, and lesson paths.",
    textVi: "Bắt đầu từ khối lớp, unit, section và lesson.",
  },
  {
    icon: Target,
    titleEn: "Practice",
    titleVi: "Luyện",
    textEn: "Complete exercises to strengthen vocabulary and grammar.",
    textVi: "Hoàn thành bài tập để củng cố từ vựng và ngữ pháp.",
  },
  {
    icon: Rocket,
    titleEn: "Review",
    titleVi: "Ôn",
    textEn: "Use revision tests to close knowledge gaps.",
    textVi: "Dùng bài ôn để lấp lỗ hổng kiến thức.",
  },
  {
    icon: UsersRound,
    titleEn: "Compete",
    titleVi: "Thi đua",
    textEn: "Keep momentum through quests and leaderboards.",
    textVi: "Giữ nhịp học qua nhiệm vụ và bảng xếp hạng.",
  },
];

export function About() {
  const { copy } = useLanguage();

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#f5f8fc] px-4 py-10 text-slate-900 md:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-10">
            <div className="flex flex-col justify-center">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
                <Sparkles className="h-4 w-4" />
                {copy("About UIFIVE", "Về UIFIVE")}
              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                {copy(
                  "A focused English learning space for high school learners.",
                  "Không gian học tiếng Anh tập trung cho học sinh THPT.",
                )}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                {copy(
                  "UIFIVE helps students learn English through structured textbook lessons, practical exercises, and motivating progress loops that make daily study feel lighter.",
                  "UIFIVE giúp học sinh học tiếng Anh qua bài học bám sát sách, bài luyện thực tế và vòng tiến độ tạo động lực để việc học mỗi ngày nhẹ hơn.",
                )}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#155ca5] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#124d8c]"
                >
                  {copy("Explore lessons", "Khám phá bài học")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/learning-guide"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-[#155ca5]/40 hover:text-[#155ca5]"
                >
                  {copy("Learning guide", "Cẩm nang học")}
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[#bfd8ff] bg-[#eef6ff] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-[#155ca5]">
                    {copy("Our purpose", "Mục tiêu của chúng tôi")}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {copy("Learn steadily", "Học đều và chắc")}
                  </h2>
                </div>
                <div className="rounded-xl bg-white p-3 text-[#155ca5] shadow-sm">
                  <HeartHandshake className="h-7 w-7" />
                </div>
              </div>

              <p className="rounded-xl bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
                {copy(
                  "We design UIFIVE for students who want a clear path, quick feedback, and small wins that add up over time.",
                  "Chúng tôi thiết kế UIFIVE cho học sinh cần lộ trình rõ, phản hồi nhanh và những tiến bộ nhỏ tích lũy theo thời gian.",
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {stats.map((item) => (
            <article
              key={item.labelEn}
              className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
            >
              <p className="text-3xl font-black text-[#155ca5]">
                {item.value}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {copy(item.labelEn, item.labelVi)}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-950">
                {copy("What we care about", "Điều UIFIVE hướng tới")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {copy(
                  "Every feature is built around clarity, consistency, and real school progress.",
                  "Mỗi tính năng được xây quanh sự rõ ràng, đều đặn và tiến bộ thật trong học tập.",
                )}
              </p>
            </div>

            <div className="space-y-4">
              {values.map((value) => {
                const Icon = value.icon;

                return (
                  <article
                    key={value.titleEn}
                    className="rounded-xl bg-slate-50 p-5"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 text-[#155ca5] shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-black text-slate-950">
                        {copy(value.titleEn, value.titleVi)}
                      </h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      {copy(value.textEn, value.textVi)}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-950">
                {copy("The UIFIVE loop", "Vòng học UIFIVE")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {copy(
                  "A simple routine helps learners know what to do next every time they open the app.",
                  "Một nhịp học đơn giản giúp học sinh luôn biết bước tiếp theo khi mở ứng dụng.",
                )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {loops.map((loop, index) => {
                const Icon = loop.icon;

                return (
                  <article
                    key={loop.titleEn}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="rounded-lg bg-[#155ca5]/10 p-3 text-[#155ca5]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-black text-slate-300">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-950">
                      {copy(loop.titleEn, loop.titleVi)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {copy(loop.textEn, loop.textVi)}
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

export default About;
