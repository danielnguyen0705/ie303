import {
  ArrowRight,
  BookOpen,
  CircleDollarSign,
  HelpCircle,
  LifeBuoy,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Wifi,
} from "lucide-react";
import { Link } from "react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { useLanguage } from "@/context/LanguageContext";

const helpTopics = [
  {
    icon: BookOpen,
    titleEn: "Learning flow",
    titleVi: "Luồng học tập",
    textEn:
      "Find your grade, open a unit, then continue through sections and lessons in order.",
    textVi:
      "Chọn khối lớp, mở unit rồi học lần lượt qua section và lesson theo thứ tự.",
  },
  {
    icon: UserRoundCheck,
    titleEn: "Account access",
    titleVi: "Tài khoản",
    textEn:
      "Get help with login, email verification, password reset, and profile details.",
    textVi:
      "Hỗ trợ đăng nhập, xác minh email, đặt lại mật khẩu và thông tin hồ sơ.",
  },
  {
    icon: CircleDollarSign,
    titleEn: "Coins and premium",
    titleVi: "Coin và gói premium",
    textEn:
      "Learn how top-up, payment history, VIP benefits, and shop items work.",
    textVi:
      "Tìm hiểu cách nạp tiền, lịch sử thanh toán, quyền lợi VIP và vật phẩm cửa hàng.",
  },
];

const quickChecks = [
  {
    icon: RefreshCw,
    titleEn: "Refresh your session",
    titleVi: "Tải lại phiên học",
    textEn:
      "Reload the page after a failed request, then try the action one more time.",
    textVi: "Tải lại trang sau khi lỗi request, rồi thử thao tác lại một lần.",
  },
  {
    icon: Wifi,
    titleEn: "Check connection",
    titleVi: "Kiểm tra kết nối",
    textEn:
      "Switch networks or disable extensions if pages keep loading slowly.",
    textVi: "Đổi mạng hoặc tắt extension nếu trang tải chậm liên tục.",
  },
  {
    icon: ShieldCheck,
    titleEn: "Allow browser cookies",
    titleVi: "Cho phép cookie",
    textEn:
      "Cookies help UIFIVE keep your login and learning progress connected.",
    textVi:
      "Cookie giúp UIFIVE duy trì đăng nhập và đồng bộ tiến độ học tập.",
  },
];

export function HelpCenter() {
  const { copy } = useLanguage();

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#f5f8fc] px-4 py-10 text-slate-900 md:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-10">
            <div className="flex flex-col justify-center">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
                <LifeBuoy className="h-4 w-4" />
                {copy("Help Center", "Trung tâm hỗ trợ")}
              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                {copy(
                  "Get unstuck and keep learning smoothly.",
                  "Gỡ vướng nhanh để tiếp tục học mượt mà.",
                )}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                {copy(
                  "Find answers for account access, lesson progress, payments, and common browser issues in one place.",
                  "Tìm câu trả lời về tài khoản, tiến độ bài học, thanh toán và các lỗi trình duyệt thường gặp.",
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
                  to="/learning-guide"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-[#155ca5]/40 hover:text-[#155ca5]"
                >
                  {copy("View learning guide", "Xem cẩm nang học")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[#bfd8ff] bg-[#eef6ff] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-[#155ca5]">
                    {copy("Need a quick answer?", "Cần trả lời nhanh?")}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {copy("Start here", "Bắt đầu tại đây")}
                  </h2>
                </div>
                <div className="rounded-xl bg-white p-3 text-[#155ca5] shadow-sm">
                  <Search className="h-7 w-7" />
                </div>
              </div>

              <p className="rounded-xl bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
                {copy(
                  "Most learning issues are fixed by refreshing the page, checking your account status, or returning to the correct unit path.",
                  "Phần lớn lỗi học tập có thể xử lý bằng cách tải lại trang, kiểm tra trạng thái tài khoản hoặc quay về đúng lộ trình unit.",
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {helpTopics.map((topic) => {
            const Icon = topic.icon;

            return (
              <article
                key={topic.titleEn}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 rounded-lg bg-[#155ca5]/10 p-3 text-[#155ca5] w-fit">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-slate-950">
                  {copy(topic.titleEn, topic.titleVi)}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {copy(topic.textEn, topic.textVi)}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-[#155ca5]/10 p-3 text-[#155ca5]">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {copy("Frequently asked questions", "Câu hỏi thường gặp")}
                </h2>
                <p className="text-sm text-slate-600">
                  {copy(
                    "The answers learners usually need first.",
                    "Những câu trả lời học sinh thường cần trước tiên.",
                  )}
                </p>
              </div>
            </div>

            <Accordion type="multiple" defaultValue={["q1"]}>
              <AccordionItem value="q1" className="border-slate-200">
                <AccordionTrigger>
                  {copy(
                    "How do I reset my password?",
                    "Làm sao để đặt lại mật khẩu?",
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  {copy(
                    "Use the Forgot password link on the sign-in page to request a reset email. If you do not receive it, check spam or contact support.",
                    "Dùng liên kết Quên mật khẩu ở trang đăng nhập để nhận email đặt lại. Nếu chưa thấy email, hãy kiểm tra spam hoặc liên hệ hỗ trợ.",
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q2" className="border-slate-200">
                <AccordionTrigger>
                  {copy(
                    "How do I buy a premium package?",
                    "Làm sao để mua gói premium?",
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  {copy(
                    "Open the Top Up page to view payment methods and available offers. If a transaction fails, contact support with your payment time and account email.",
                    "Mở trang Nạp tiền để xem phương thức thanh toán và ưu đãi. Nếu giao dịch lỗi, hãy gửi thời gian thanh toán và email tài khoản cho hỗ trợ.",
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q3" className="border-slate-200">
                <AccordionTrigger>
                  {copy(
                    "Where can I see my progress?",
                    "Xem tiến độ học ở đâu?",
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  {copy(
                    "Your learning progress is visible on the dashboard, grade pages, and unit pages. Completed lessons, coins, XP, and streaks update as you study.",
                    "Tiến độ học hiển thị ở dashboard, trang khối lớp và trang unit. Bài đã hoàn thành, coin, XP và streak sẽ cập nhật khi bạn học.",
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q4" className="border-slate-200">
                <AccordionTrigger>
                  {copy(
                    "Why is a lesson locked?",
                    "Vì sao bài học bị khóa?",
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  {copy(
                    "Some lessons require earlier sections, review tasks, or premium access. Return to the unit path and finish the previous step first.",
                    "Một số bài cần hoàn thành section trước, nhiệm vụ ôn tập hoặc quyền premium. Hãy quay lại lộ trình unit và hoàn thành bước trước đó.",
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="space-y-8">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-[#fed023]/30 p-3 text-[#9a7200]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    {copy("Quick checks", "Kiểm tra nhanh")}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {copy(
                      "Try these before sending a support request.",
                      "Hãy thử các bước này trước khi gửi yêu cầu hỗ trợ.",
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {quickChecks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.titleEn}
                      className="rounded-xl bg-slate-50 p-4"
                    >
                      <div className="mb-2 flex items-center gap-3">
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
            </section>

            <section className="rounded-2xl border border-[#bfd8ff] bg-[#eef6ff] p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-black text-slate-950">
                {copy("Still need help?", "Vẫn cần hỗ trợ?")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {copy(
                  "Send us your account email, the page where the issue happened, and a short description so we can check faster.",
                  "Gửi email tài khoản, trang xảy ra lỗi và mô tả ngắn để đội hỗ trợ kiểm tra nhanh hơn.",
                )}
              </p>

              <a
                href="mailto:support@uifive.com"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#155ca5] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#124d8c]"
              >
                <Mail className="h-4 w-4" />
                support@uifive.com
              </a>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

export default HelpCenter;
