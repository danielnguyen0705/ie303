import {
  ArrowRight,
  Bell,
  Database,
  Eye,
  FileCheck2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "@/context/LanguageContext";

const privacyPrinciples = [
  {
    icon: Eye,
    titleEn: "Clear collection",
    titleVi: "Thu thập rõ ràng",
    textEn:
      "We collect the information needed to create accounts, keep learners signed in, and show learning progress.",
    textVi:
      "Chúng tôi thu thập thông tin cần thiết để tạo tài khoản, duy trì đăng nhập và hiển thị tiến độ học.",
  },
  {
    icon: LockKeyhole,
    titleEn: "Protected access",
    titleVi: "Bảo vệ truy cập",
    textEn:
      "Account access is protected through authentication and role-based areas for learners and admins.",
    textVi:
      "Truy cập tài khoản được bảo vệ qua xác thực và phân quyền khu vực học sinh/quản trị.",
  },
  {
    icon: UserCheck,
    titleEn: "Learner control",
    titleVi: "Người học kiểm soát",
    textEn:
      "Learners can review profile details, progress, payments, and contact support when something needs correction.",
    textVi:
      "Người học có thể xem hồ sơ, tiến độ, thanh toán và liên hệ hỗ trợ khi cần chỉnh sửa.",
  },
];

const dataTypes = [
  {
    titleEn: "Account information",
    titleVi: "Thông tin tài khoản",
    textEn: "Name, email, login status, role, and profile settings.",
    textVi: "Tên, email, trạng thái đăng nhập, vai trò và cài đặt hồ sơ.",
  },
  {
    titleEn: "Learning activity",
    titleVi: "Hoạt động học tập",
    textEn: "Lessons completed, XP, coins, streaks, test results, and review history.",
    textVi: "Bài đã hoàn thành, XP, coin, streak, kết quả kiểm tra và lịch sử ôn tập.",
  },
  {
    titleEn: "Payment records",
    titleVi: "Lịch sử thanh toán",
    textEn: "Top-up requests, payment history, premium status, and related support details.",
    textVi: "Yêu cầu nạp tiền, lịch sử thanh toán, trạng thái premium và thông tin hỗ trợ liên quan.",
  },
];

const commitments = [
  {
    icon: Database,
    titleEn: "Use data for learning features",
    titleVi: "Dùng dữ liệu cho tính năng học",
    textEn:
      "Progress data helps show dashboards, recommendations, revision paths, and personalized questions.",
    textVi:
      "Dữ liệu tiến độ giúp hiển thị dashboard, gợi ý, lộ trình ôn tập và câu hỏi cá nhân hóa.",
  },
  {
    icon: Bell,
    titleEn: "Send useful notices",
    titleVi: "Gửi thông báo hữu ích",
    textEn:
      "We may use contact details for account notices, support updates, and important service information.",
    textVi:
      "Chúng tôi có thể dùng thông tin liên hệ cho thông báo tài khoản, cập nhật hỗ trợ và thông tin dịch vụ quan trọng.",
  },
  {
    icon: ShieldCheck,
    titleEn: "Limit unnecessary sharing",
    titleVi: "Hạn chế chia sẻ không cần thiết",
    textEn:
      "Learner information should only be used for operating, improving, and supporting UIFIVE.",
    textVi:
      "Thông tin người học chỉ nên được dùng để vận hành, cải thiện và hỗ trợ UIFIVE.",
  },
];

export function Privacy() {
  const { copy } = useLanguage();

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#f5f8fc] px-4 py-10 text-slate-900 md:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-10">
            <div className="flex flex-col justify-center">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
                <Sparkles className="h-4 w-4" />
                {copy("Privacy Policy", "Chính sách bảo mật")}
              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                {copy(
                  "How UIFIVE handles learner information.",
                  "Cách UIFIVE xử lý thông tin người học.",
                )}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                {copy(
                  "This page explains what information may be collected, why it is used, and how learners can contact UIFIVE about privacy questions.",
                  "Trang này giải thích những thông tin có thể được thu thập, lý do sử dụng và cách người học liên hệ UIFIVE khi có câu hỏi về bảo mật.",
                )}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="mailto:support@uifive.com"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#155ca5] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#124d8c]"
                >
                  <Mail className="h-4 w-4" />
                  support@uifive.com
                </a>
                <Link
                  to="/terms"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-[#155ca5]/40 hover:text-[#155ca5]"
                >
                  {copy("View terms", "Xem điều khoản")}
                  <ArrowRight className="h-4 w-4" />
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
                  <FileCheck2 className="h-7 w-7" />
                </div>
              </div>

              <p className="rounded-xl bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
                {copy(
                  "This is a learner-friendly summary for the UIFIVE project. For official school or legal review, contact the support team.",
                  "Đây là bản tóm tắt thân thiện với người học cho dự án UIFIVE. Nếu cần rà soát chính thức, hãy liên hệ đội hỗ trợ.",
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {privacyPrinciples.map((item) => {
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

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-black text-slate-950">
              {copy("Information we may use", "Thông tin có thể sử dụng")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy(
                "UIFIVE uses information that supports account access, learning progress, and payment support.",
                "UIFIVE sử dụng thông tin phục vụ truy cập tài khoản, tiến độ học tập và hỗ trợ thanh toán.",
              )}
            </p>

            <div className="mt-6 space-y-4">
              {dataTypes.map((item) => (
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
              {copy("Our commitments", "Cam kết của chúng tôi")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy(
                "Privacy choices should be understandable and tied to real learning needs.",
                "Các lựa chọn về quyền riêng tư nên dễ hiểu và gắn với nhu cầu học tập thực tế.",
              )}
            </p>

            <div className="mt-6 space-y-4">
              {commitments.map((item) => {
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
          </div>
        </section>
      </div>
    </main>
  );
}

export default Privacy;
