import { useState } from "react";
import AuthModal from "@/components/AuthModal";

export function PublicLanding() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f6ff] text-[#1e2e51] selection:bg-[#73aaf9] selection:text-[#002a54]">
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="font-['Nunito'] text-xl font-black tracking-tight text-blue-800">
            UIFIVE
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="font-['Lexend'] text-sm font-medium text-slate-600 transition-colors hover:text-blue-800"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="rounded-full bg-[#155ca5] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#155ca5]/20 transition-transform duration-200 active:scale-95"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <main className="overflow-x-hidden pt-24">
        <section className="relative mb-24 flex min-h-[820px] items-center">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-12">
            <div className="lg:col-span-7 lg:ml-[8%]">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-[#fed023] px-4 py-1.5 text-[#594700] shadow-[0_10px_32px_-4px_rgba(30,46,81,0.06)]">
                <span className="text-xs font-black uppercase tracking-wider">
                  Học Tiếng Anh Gen Z
                </span>
              </div>

              <h1 className="mb-6 font-['Nunito'] text-5xl font-black leading-[1.05] tracking-tighter md:text-7xl lg:text-8xl">
                Học Tiếng Anh Theo Cách Của{" "}
                <span className="italic text-[#155ca5]">Gen Z</span>
              </h1>

              <p className="mb-10 max-w-xl font-['Lexend'] text-lg leading-relaxed text-[#4c5b81] md:text-xl">
                Bám sát sách giáo khoa Global Success lớp 10-12 với lộ trình cá
                nhân hóa và gamification sinh động.
              </p>

              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full rounded-full bg-gradient-to-r from-[#155ca5] to-[#005095] px-10 py-5 text-lg font-bold text-white shadow-xl shadow-[#155ca5]/30 transition-transform hover:scale-105 active:scale-95 sm:w-auto"
                >
                  Bắt đầu học ngay
                </button>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="group flex items-center gap-2 font-bold text-[#155ca5]"
                >
                  Đăng nhập
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </div>
            </div>

            <div className="relative lg:col-span-5">
              <div className="relative z-10 rotate-3 rounded-3xl bg-white p-4 shadow-[0_10px_32px_-4px_rgba(30,46,81,0.06)]">
                <img
                  alt="Kinetic learning illustration"
                  className="h-[500px] w-full rounded-2xl object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0im93LZXsbCCEnEj1m9ZT0Acv7T5WkehLs8TjAEsK-CuRhUGpn5sclHq-1Ua_ROiuLrQzJYftDGPTQa-ULwdqbG7TorMfDIkr-ABzX1w4MCYJKQA5n4F-i61vHIUPrWzOt9Z7iT_OA3gkFWT7v22TUXAiODG7in-5LwluA7mFdsYzo32f0lRvgEcW9OkT63HNK0pj-rrK9pqnbT-3U6MUrOUrr6jQj6b-obNWJuQhmYdD5X6c8tcEKRztTU5wU1jW1zQ27rF97Fg"
                />
              </div>
              <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#73aaf9]/20 blur-[100px]" />
            </div>
          </div>
        </section>

        <section className="mx-auto mb-28 max-w-7xl px-6">
          <div className="rounded-3xl border border-[#9eacd7]/20 bg-[#eef0ff] p-8">
            <p className="font-['Nunito'] text-2xl font-black md:text-3xl">
              Hơn 10,000 học sinh đang tham gia chuỗi học tập mỗi ngày.
            </p>
          </div>
        </section>

        <section className="mx-auto mb-32 max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <article className="rounded-3xl bg-white p-10 shadow-[0_10px_32px_-4px_rgba(30,46,81,0.06)]">
              <h3 className="mb-4 font-['Nunito'] text-2xl font-black">
                Bám sát SGK
              </h3>
              <p className="font-['Lexend'] leading-relaxed text-[#4c5b81]">
                Toàn bộ nội dung chuẩn bị GD&DT, cập nhật mới nhất cho chương
                trình Global Success.
              </p>
            </article>
            <article className="rounded-3xl bg-white p-10 shadow-[0_10px_32px_-4px_rgba(30,46,81,0.06)]">
              <h3 className="mb-4 font-['Nunito'] text-2xl font-black">
                Học mà chơi
              </h3>
              <p className="font-['Lexend'] leading-relaxed text-[#4c5b81]">
                Tích lũy coin, duy trì streak, đưa top bảng xếp hạng cùng bạn bè
                trong từng bài học.
              </p>
            </article>
            <article className="rounded-3xl bg-white p-10 shadow-[0_10px_32px_-4px_rgba(30,46,81,0.06)]">
              <h3 className="mb-4 font-['Nunito'] text-2xl font-black">
                AI Native
              </h3>
              <p className="font-['Lexend'] leading-relaxed text-[#4c5b81]">
                Chấm điểm phát âm và writing theo thời gian thực để bạn tiến bộ
                nhanh và bền vững.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/40 bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-8">
          <div className="font-['Nunito'] text-lg font-black text-blue-900">
            UIFIVE
          </div>
          <p className="mt-4 font-['Lexend'] text-xs uppercase tracking-widest text-slate-500">
            © 2026 UIFIVE. Built for the next generation of linguists.
          </p>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
