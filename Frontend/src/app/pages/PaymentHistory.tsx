import { useEffect, useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  Coins,
  Crown,
} from "lucide-react";
import { getMyTransactions } from "@/api/payments";

export interface PaymentHistoryTransaction {
  id: number;
  transactionCode: string;
  type: "COIN" | "VIP";
  provider: "MOCK" | "MOMO" | "VNPAY" | "BANK";
  status: "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING";
  amountMoney: number;
  amountCoin: number;
  durationDays: number | null;
  description: string;
  offerName: string;
  createdAt: string;
  paidAt: string;
}

export function PaymentHistory() {
  const [transactions, setTransactions] = useState<PaymentHistoryTransaction[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getMyTransactions();

        if (!response.success) {
          setError(response.error?.message || "Failed to load transactions");
          return;
        }

        setTransactions((response.data as PaymentHistoryTransaction[]) || []);
      } catch (err) {
        console.error("Error loading transactions:", err);
        setError("Failed to load payment history");
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "FAILED":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "CANCELLED":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-50 text-green-700 border-green-200";
      case "FAILED":
        return "bg-red-50 text-red-700 border-red-200";
      case "CANCELLED":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "PENDING":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "Thành công";
      case "FAILED":
        return "Thất bại";
      case "CANCELLED":
        return "Đã hủy";
      case "PENDING":
        return "Chờ xử lý";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  const formatProvider = (provider: string) => {
    const providerMap: Record<string, string> = {
      MOCK: "Demo",
      MOMO: "Momo",
      VNPAY: "VNPay",
      BANK: "Chuyển khoản",
    };
    return providerMap[provider] || provider;
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#155ca5]" />
          <p className="text-slate-600 font-semibold">
            Đang tải lịch sử nạp tiền...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-6 md:py-10 pb-24 md:pb-12 space-y-8">
      {/* Header */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1a5fa8] to-[#005095] flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              Lịch sử nạp tiền
            </h1>
            <p className="text-slate-600 mt-1">
              Xem tất cả các giao dịch nạp coin và VIP của bạn
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-6 py-4 text-red-700 font-semibold">
          {error}
        </div>
      )}

      {/* Stats Overview - Moved to top */}
      {transactions.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 font-medium text-sm">Thành công</p>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-black text-green-700">
              {transactions.filter((t) => t.status === "SUCCESS").length}
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 font-medium text-sm">Chờ xử lý</p>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-black text-blue-700">
              {transactions.filter((t) => t.status === "PENDING").length}
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 font-medium text-sm">Thất bại</p>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-black text-red-700">
              {
                transactions.filter(
                  (t) => t.status === "FAILED" || t.status === "CANCELLED",
                ).length
              }
            </p>
          </div>
        </section>
      )}

      {/* Transactions Table */}
      {transactions.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                    Mã giao dịch
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                    Loại
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                    Mô tả
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                    Số tiền
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                    Hình thức
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                    Thời gian
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-[#155ca5]" />
                        <code className="font-mono text-sm font-semibold text-slate-900">
                          {tx.transactionCode}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                          tx.type === "COIN"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {tx.type === "COIN" ? (
                          <>
                            <Coins className="w-4 h-4" />
                            Nạp Coin
                          </>
                        ) : (
                          <>
                            <Crown className="w-4 h-4" />
                            VIP
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {tx.offerName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {tx.description}
                        </span>
                        {tx.type === "COIN" && (
                          <span className="text-xs text-amber-600 font-semibold">
                            +{tx.amountCoin.toLocaleString()} coins
                          </span>
                        )}
                        {tx.type === "VIP" && tx.durationDays && (
                          <span className="text-xs text-purple-600 font-semibold">
                            {tx.durationDays} ngày
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">
                        {tx.amountMoney.toLocaleString()} VND
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 font-medium">
                        {formatProvider(tx.provider)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(tx.status)}`}
                        >
                          {getStatusLabel(tx.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(tx.paidAt || tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <CreditCard className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600 font-semibold mb-2">
            Chưa có lịch sử nạp tiền
          </p>
          <p className="text-slate-500">Hãy nạp coin hoặc mua VIP để bắt đầu</p>
        </div>
      )}
    </main>
  );
}
