import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CircleDollarSign,
  FileText,
  GraduationCap,
  Mail,
  Scale,
  ShieldAlert,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "@/context/LanguageContext";

const termHighlights = [
  {
    icon: UserRoundCheck,
    titleEn: "Use your own account",
    titleVi: "Dùng tài khoản của bạn",
    textEn:
      "Keep login information private and make sure account details are accurate.",
    textVi:
      "Giữ thông tin đăng nhập riêng tư và đảm bảo thông tin tài khoản chính xác.",
  },
  {
    icon: BookOpenCheck,
    titleEn: "Study fairly",
    titleVi: "Học tập công bằng",
    textEn:
      "Use UIFIVE to learn, practice, and review. Avoid actions that manipulate scores or disrupt other learners.",
    textVi:
      "Dùng UIFIVE để học, luyện và ôn tập. Tránh thao tác gian lận điểm hoặc làm ảnh hưởng người học khác.",
  },
  {
    icon: ShieldAlert,
    titleEn: "Respect platform rules",
    titleVi: "Tôn trọng quy định nền tảng",
    textEn:
      "Do not attack, scrape, copy, or misuse the service, content, data, or administrative areas.",
    textVi:
      "Không tấn công, thu thập trái phép, sao chép hoặc lạm dụng dịch vụ, nội dung, dữ liệu hay khu vực quản trị.",
  },
];

const sections = [
  {
    titleEn: "Accounts and access",
    titleVi: "Tài khoản và truy cập",
    textEn:
      "Learners are responsible for activity under their account. UIFIVE may restrict access when an account appears unsafe, misused, or violates platform rules.",
    textVi:
      "Người học chịu trách nhiệm cho hoạt động dưới tài khoản của mình. UIFIVE có thể hạn chế truy cập khi tài khoản không an toàn, bị lạm dụng hoặc vi phạm quy định.",
  },
  {
    titleEn: "Learning content",
    titleVi: "Nội dung học tập",
    textEn:
      "Lessons, questions, reviews, and learning materials are provided for personal study and classroom-aligned practice.",
    textVi:
      "Bài học, câu hỏi, bài ôn và tài liệu học tập được cung cấp cho mục đích tự học và luyện tập bám sát lớp học.",
  },
  {
    titleEn: "Progress and rewards",
    titleVi: "Tiến độ và phần thưởng",
    textEn:
      "XP, coins, streaks, quests, and leaderboard data are part of the learning experience and may change as features improve.",
    textVi:
      "XP, coin, streak, nhiệm vụ và dữ liệu bảng xếp hạng là một phần trải nghiệm học tập và có thể thay đổi khi tính năng được cải thiện.",
  },
  {
    titleEn: "Payments and premium",
    titleVi: "Thanh toán và premium",
    textEn:
      "Premium access, top-up offers, and payment history depend on successful transactions and the available payment methods in UIFIVE.",
    textVi:
      "Quyền premium, ưu đãi nạp tiền và lịch sử thanh toán phụ thuộc vào giao dịch thành công và phương thức thanh toán hiện có trên UIFIVE.",
  },
];

const responsibilities = [
  {
    icon: GraduationCap,
    titleEn: "For learners",
    titleVi: "Với người học",
    textEn:
      "Complete lessons honestly, review mistakes, and contact support when something looks wrong.",
    textVi:
      "Hoàn thành bài học trung thực, xem lại lỗi sai và liên hệ hỗ trợ khi có vấn đề bất thường.",
  },
  {
    icon: CircleDollarSign,
    titleEn: "For payments",
    titleVi: "Với thanh toán",
    textEn:
      "Check payment details before submitting and keep transaction information for support requests.",
    textVi:
      "Kiểm tra thông tin trước khi thanh toán và giữ dữ liệu giao dịch để gửi hỗ trợ khi cần.",
  },
  {
    icon: BadgeCheck,
    titleEn: "For UIFIVE",
    titleVi: "Với UIFIVE",
    textEn:
      "Maintain the service, improve learning features, and provide reasonable support for reported issues.",
    textVi:
      "Duy trì dịch vụ, cải thiện tính năng học tập và hỗ trợ hợp lý cho các vấn đề được báo cáo.",
  },
];

export function Terms() {
  const { copy } = useLanguage();

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#f5f8fc] px-4 py-10 text-slate-900 md:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-10">
            <div className="flex flex-col justify-center">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
                <Sparkles className="h-4 w-4" />
                {copy("Terms of Use", "Điều khoản sử dụng")}
              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                {copy(
                  "The rules for learning with UIFIVE.",
                  "Quy định khi học cùng UIFIVE.",
                )}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                {copy(
                  "These terms explain how learners should use UIFIVE accounts, content, practice tools, rewards, payments, and support features.",
                  "Điều khoản này giải thích cách người học sử dụng tài khoản, nội dung, công cụ luyện tập, phần thưởng, thanh toán và tính năng hỗ trợ của UIFIVE.",
                )}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#155ca5] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#124d8c]"
                >
                  {copy("Back to learning", "Quay lại học")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/privacy"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-[#155ca5]/40 hover:text-[#155ca5]"
                >
                  {copy("View privacy", "Xem bảo mật")}
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[#bfd8ff] bg-[#eef6ff] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-[#155ca5]">
                    {copy("Last updated", "Cập nhật lần cuối")}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {copy("May 2026", "Tháng 5 2026")}
                  </h2>
                </div>
                <div className="rounded-xl bg-white p-3 text-[#155ca5] shadow-sm">
                  <Scale className="h-7 w-7" />
                </div>
              </div>

              <p className="rounded-xl bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
                {copy(
                  "This page is a plain-language project policy. Contact support if your school, team, or account needs specific clarification.",
                  "Đây là chính sách dự án viết bằng ngôn ngữ dễ hiểu. Hãy liên hệ hỗ trợ nếu nhà trường, nhóm hoặc tài khoản cần làm rõ thêm.",
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {termHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.titleEn}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 w-fit rounded-lg bg-[#155ca5]/10 p-3 text-[#155ca5]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-slate-950">
                  {copy(item.titleEn, item.titleVi)}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {copy(item.textEn, item.textVi)}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-[#155ca5]/10 p-3 text-[#155ca5]">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {copy("Core terms", "Điều khoản chính")}
                </h2>
                <p className="text-sm text-slate-600">
                  {copy(
                    "The most important parts of using UIFIVE responsibly.",
                    "Những điểm quan trọng nhất khi sử dụng UIFIVE có trách nhiệm.",
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {sections.map((item) => (
                <article
                  key={item.titleEn}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <h3 className="font-black text-slate-950">
                    {copy(item.titleEn, item.titleVi)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {copy(item.textEn, item.textVi)}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-black text-slate-950">
              {copy("Shared responsibilities", "Trách nhiệm chung")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy(
                "A healthy learning space works best when learners and the platform each do their part.",
                "Một không gian học tập lành mạnh hoạt động tốt nhất khi người học và nền tảng cùng làm đúng phần của mình.",
              )}
            </p>

            <div className="mt-6 space-y-4">
              {responsibilities.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.titleEn}
                    className="rounded-xl bg-slate-50 p-5"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 text-[#155ca5] shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-black text-slate-950">
                        {copy(item.titleEn, item.titleVi)}
                      </h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      {copy(item.textEn, item.textVi)}
                    </p>
                  </article>
                );
              })}
            </div>

            <a
              href="mailto:support@uifive.com"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#155ca5] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#124d8c]"
            >
              <Mail className="h-4 w-4" />
              support@uifive.com
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Terms;
