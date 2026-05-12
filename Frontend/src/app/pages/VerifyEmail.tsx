import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { verifyEmail } from "@/api/auth";

type VerifyStatus = "loading" | "success" | "error";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("Đang xác thực email của bạn...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Thiếu token xác thực trong đường dẫn.");
      return;
    }

    let isActive = true;

    const run = async () => {
      const response = await verifyEmail(token);

      if (!isActive) {
        return;
      }

      if (response.success) {
        setStatus("success");
        setMessage("Email đã được xác thực thành công. Bạn có thể đăng nhập ngay.");
        return;
      }

      setStatus("error");
      setMessage(response.error?.message || "Xác thực email thất bại.");
    };

    void run();

    return () => {
      isActive = false;
    };
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f6f6ff] via-white to-[#e8f1ff] px-6 text-[#1e2e51]">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-[0_20px_60px_-12px_rgba(21,92,165,0.18)]">
        <div className="mb-4 inline-flex rounded-full bg-[#eef4ff] px-4 py-1 text-sm font-semibold text-[#155ca5]">
          Email Verification
        </div>

        <h1 className="font-['Nunito'] text-3xl font-black tracking-tight">
          {status === "success" ? "Xác thực thành công" : "Xác thực email"}
        </h1>

        <p className="mt-3 font-['Lexend'] leading-relaxed text-slate-600">
          {message}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-[#155ca5] px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
          >
            Về trang chủ
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            {status === "success" ? "Đăng nhập" : "Thử lại"}
          </Link>
        </div>
      </div>
    </div>
  );
}
