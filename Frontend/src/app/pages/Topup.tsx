import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  BadgeCheck,
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  Gem,
  Loader2,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  createCheckoutTransaction,
  getActivePaymentOffers,
  getCoinBalance,
  getMyTransactions,
  mockConfirmPayment,
  paymentWebhook,
} from "@/api";
import type {
  PaymentOffer,
  PaymentProvider,
  PaymentTransaction,
  TopupCoinPack,
  TopupCoinPackIcon,
  TopupVipPlan,
} from "@/api/types";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const VIP_PLANS: TopupVipPlan[] = [
  {
    id: "month",
    title: "1 Month",
    subtitle: "Short Term",
    monthlyPrice: 14,
    annualPrice: 12,
    features: ["Ad-free Experience", "AI Writing Feedback"],
  },
  {
    id: "year",
    title: "1 Year",
    subtitle: "Elite Status",
    monthlyPrice: 12,
    annualPrice: 9,
    note: "Billed annually ($108)",
    features: [
      "Ad-free Experience",
      "AI Writing Feedback",
      "Detailed Project Keys",
      "Exclusive Profile Frame",
    ],
    highlighted: true,
  },
  {
    id: "half-year",
    title: "6 Months",
    subtitle: "Momentum",
    monthlyPrice: 13,
    annualPrice: 12,
    features: [
      "Ad-free Experience",
      "AI Writing Feedback",
      "Detailed Project Keys",
    ],
  },
];

type CheckoutCoinPack = TopupCoinPack & {
  offer: PaymentOffer;
};

type PendingCheckout = {
  transactionCode: string;
  provider: PaymentProvider;
  offerId: number;
};

type CheckoutIntent = {
  triggerId: string;
  offer: PaymentOffer;
  successTitle: string;
  successMessage: string;
};

const PENDING_CHECKOUT_KEY = "uifive.pendingCheckout";

const PAYMENT_PROVIDER_OPTIONS: Array<{
  value: PaymentProvider;
  label: string;
}> = [
  { value: "MOMO", label: "Momo" },
  { value: "VNPAY", label: "VNPay" },
  { value: "BANK", label: "Bank QR" },
  { value: "MOCK", label: "Mock (Local Test)" },
];

function PackIcon({ icon }: { icon: TopupCoinPackIcon }) {
  if (icon === "wallet") {
    return <Wallet className="w-7 h-7" />;
  }

  if (icon === "coins") {
    return <Coins className="w-7 h-7" />;
  }

  if (icon === "gem") {
    return <Gem className="w-7 h-7" />;
  }

  return <Sparkles className="w-7 h-7" />;
}

export function Topup() {
  const { copy } = useLanguage();
  const { refreshCurrentUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [activeOffers, setActiveOffers] = useState<PaymentOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [provider, setProvider] = useState<PaymentProvider>("MOMO");
  const [checkoutIntent, setCheckoutIntent] = useState<CheckoutIntent | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const popup = useNotificationPopup({
    autoClose: true,
    autoCloseDuration: 2500,
  });

  const readPendingCheckout = (): PendingCheckout | null => {
    try {
      const raw = window.sessionStorage.getItem(PENDING_CHECKOUT_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as PendingCheckout;
      if (!parsed.transactionCode || !parsed.provider || !parsed.offerId) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  };

  const savePendingCheckout = (checkout: PendingCheckout) => {
    window.sessionStorage.setItem(
      PENDING_CHECKOUT_KEY,
      JSON.stringify(checkout),
    );
  };

  const clearPendingCheckout = () => {
    window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  };

  const clearReturnQuery = () => {
    const url = new URL(window.location.href);

    const keys = Array.from(url.searchParams.keys());
    keys.forEach((key) => {
      if (key === "paymentReturn" || key.startsWith("vnp_")) {
        url.searchParams.delete(key);
      }
    });

    window.history.replaceState({}, document.title, url.pathname + url.search);
  };

  const isPaymentReturnRequest = () => {
    const query = new URLSearchParams(window.location.search);
    return (
      query.get("paymentReturn") === "1" ||
      query.has("vnp_TxnRef") ||
      query.has("vnp_ResponseCode")
    );
  };

  const readReturnedTransactionCode = () => {
    const query = new URLSearchParams(window.location.search);
    const returnedCode = query.get("vnp_TxnRef")?.trim();
    if (returnedCode) {
      return returnedCode;
    }

    return readPendingCheckout()?.transactionCode || null;
  };

  const buildReturnUrl = () => {
    const returnUrl = new URL(window.location.href);
    returnUrl.pathname = "/topup";
    returnUrl.search = "";
    returnUrl.searchParams.set("paymentReturn", "1");
    return returnUrl.toString();
  };

  const refreshBalance = async () => {
    const response = await getCoinBalance();
    if (response.success) {
      setBalance(response.data?.balance || 0);
    }

    void refreshCurrentUser(false);
  };

  const waitForTransactionResult = async (transactionCode: string) => {
    let latestTransaction: PaymentTransaction | undefined;

    for (let i = 0; i < 5; i += 1) {
      const transactionsResponse = await getMyTransactions();
      if (!transactionsResponse.success || !transactionsResponse.data) {
        return {
          transaction: latestTransaction,
          errorMessage:
            transactionsResponse.error?.message ||
            copy(
              "Please check payment history.",
              "Vui lòng kiểm tra lịch sử thanh toán.",
            ),
        };
      }

      latestTransaction = transactionsResponse.data.find(
        (item) => item.transactionCode === transactionCode,
      );

      if (!latestTransaction || latestTransaction.status !== "PENDING") {
        return { transaction: latestTransaction, errorMessage: null };
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 1200);
      });
    }

    return { transaction: latestTransaction, errorMessage: null };
  };

  const syncReturnedCheckout = async () => {
    const query = new URLSearchParams(window.location.search);
    const transactionCode = readReturnedTransactionCode();

    if (!transactionCode) {
      clearReturnQuery();
      return;
    }

    const { transaction, errorMessage } =
      await waitForTransactionResult(transactionCode);

    if (errorMessage) {
      popup.warning({
        title: copy(
          "Unable to verify payment result",
          "Không thể xác minh kết quả thanh toán",
        ),
        message: errorMessage,
      });
      clearReturnQuery();
      return;
    }

    if (!transaction) {
      popup.warning({
        title: copy("Payment not found", "Không tìm thấy thanh toán"),
        message: copy(
          "Transaction was created but has not been synced yet.",
          "Giao dịch đã được tạo nhưng chưa đồng bộ.",
        ),
        description: `${copy("Transaction:", "Giao dịch:")} ${transactionCode}`,
      });
      clearReturnQuery();
      return;
    }

    if (transaction.status === "SUCCESS") {
      await refreshBalance();
      popup.success({
        title: copy("Payment successful", "Thanh toán thành công"),
        message: copy(
          "Your transaction was confirmed.",
          "Giao dịch của bạn đã được xác nhận.",
        ),
        description: `${copy("Transaction:", "Giao dịch:")} ${transaction.transactionCode}`,
      });
      clearPendingCheckout();
    } else if (transaction.status === "PENDING") {
      const vnpResponseCode = query.get("vnp_ResponseCode");

      popup.warning({
        title: copy("Payment is pending", "Thanh toán đang chờ"),
        message:
          vnpResponseCode && vnpResponseCode !== "00"
            ? copy(
                `VNPAY return code ${vnpResponseCode}. Waiting for server callback.`,
                `Mã trả về VNPAY ${vnpResponseCode}. Đang chờ server callback.`,
              )
            : copy(
                "Please wait a moment and check payment history.",
                "Vui lòng chờ một lát và kiểm tra lịch sử thanh toán.",
              ),
        description: `${copy("Transaction:", "Giao dịch:")} ${transaction.transactionCode}`,
      });
    } else {
      popup.error({
        title: copy("Payment failed", "Thanh toán thất bại"),
        message: `${copy("Status:", "Trạng thái:")} ${transaction.status}`,
        description: `${copy("Transaction:", "Giao dịch:")} ${transaction.transactionCode}`,
      });
      clearPendingCheckout();
    }

    clearReturnQuery();
  };

  useEffect(() => {
    const loadTopupData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [balanceResponse, offersResponse] = await Promise.all([
          getCoinBalance(),
          getActivePaymentOffers(),
        ]);

        if (!balanceResponse.success) {
          setError(
            balanceResponse.error?.message ||
              copy("Failed to load coin balance", "Không thể tải số dư xu"),
          );
          return;
        }

        setBalance(balanceResponse.data?.balance || 0);

        if (!offersResponse.success) {
          setError(
            offersResponse.error?.message ||
              copy("Failed to load offers", "Không thể tải ưu đãi"),
          );
          return;
        }

        setActiveOffers(offersResponse.data || []);

        if (isPaymentReturnRequest()) {
          await syncReturnedCheckout();
        }
      } catch (err) {
        console.error("Error loading topup data:", err);
        setError(
          copy("Failed to load top-up data", "Không thể tải dữ liệu nạp tiền"),
        );
      } finally {
        setLoading(false);
      }
    };

    loadTopupData();
  }, []);

  const heroSubtitle = useMemo(() => {
    if (loading)
      return copy("Syncing your wallet...", "Đang đồng bộ ví của bạn...");
    if (error)
      return copy(
        "Continue with curated VIP plans and coin bundles.",
        "Tiếp tục với các gói VIP và gói xu được chọn lọc.",
      );
    return copy(
      `Your current balance is ${balance.toLocaleString()} coins.`,
      `Số dư hiện tại của bạn là ${balance.toLocaleString()} xu.`,
    );
  }, [balance, copy, error, loading]);

  const findVipOffer = (plan: TopupVipPlan): PaymentOffer | undefined => {
    const durationDaysMap: Record<TopupVipPlan["id"], number> = {
      month: 30,
      "half-year": 180,
      year: 365,
    };

    return activeOffers.find(
      (offer) =>
        offer.active &&
        offer.type === "VIP" &&
        offer.durationDays === durationDaysMap[plan.id],
    );
  };

  const findCoinOffer = (pack: TopupCoinPack): PaymentOffer | undefined => {
    return activeOffers.find(
      (offer) =>
        offer.active &&
        offer.type === "COIN" &&
        offer.coinAmount === pack.coins,
    );
  };

  const visibleVipPlans = VIP_PLANS.filter((plan) => findVipOffer(plan));

  const visibleCoinPacks = useMemo<CheckoutCoinPack[]>(() => {
    const icons: TopupCoinPackIcon[] = ["wallet", "coins", "gem", "sparkles"];

    return activeOffers
      .filter((offer) => offer.active && offer.type === "COIN")
      .map((offer, index) => ({
        id: `coin-${offer.id}`,
        label: offer.name,
        coins: offer.coinAmount || 0,
        priceUsd: offer.price / 25000, // convert VND to approximate USD for icon display
        icon: icons[index % icons.length],
        offer,
      }));
  }, [activeOffers]);

  const finalizeMockCheckout = async (
    transactionCode: string,
    offer: PaymentOffer,
    successTitle: string,
    successMessage: string,
  ) => {
    const confirmResponse = await mockConfirmPayment(transactionCode);

    let confirmedTransaction: PaymentTransaction | undefined =
      confirmResponse.data;

    if (!confirmResponse.success) {
      const webhookResponse = await paymentWebhook({
        transactionCode,
        provider: "MOCK",
        status: "SUCCESS",
        amountMoney: offer.price,
        providerTransactionId: `MOCK_${Date.now()}`,
      });

      if (!webhookResponse.success || !webhookResponse.data) {
        popup.warning({
          title: copy("Transaction pending", "Giao dịch đang chờ"),
          message:
            confirmResponse.error?.message ||
            webhookResponse.error?.message ||
            copy(
              "Checkout created, waiting for payment confirmation.",
              "Checkout đã được tạo, đang chờ xác nhận thanh toán.",
            ),
          description: `${copy("Transaction:", "Giao dịch:")} ${transactionCode}`,
        });
        return;
      }

      confirmedTransaction = webhookResponse.data;
    }

    await refreshBalance();
    clearPendingCheckout();

    popup.success({
      title: successTitle,
      message: successMessage,
      description: `${copy("Transaction:", "Giao dịch:")} ${
        confirmedTransaction?.transactionCode || transactionCode
      }`,
    });
  };

  const runCheckout = async (
    offer: PaymentOffer,
    successTitle: string,
    successMessage: string,
    selectedProvider: PaymentProvider,
  ) => {
    const checkoutResponse = await createCheckoutTransaction(offer.id, {
      provider: selectedProvider,
      returnUrl: buildReturnUrl(),
    });

    if (!checkoutResponse.success || !checkoutResponse.data) {
      popup.error({
        title: copy("Checkout failed", "Checkout thất bại"),
        message:
          checkoutResponse.error?.message ||
          copy("Unable to create transaction", "Không thể tạo giao dịch"),
      });
      return;
    }

    const checkoutData = checkoutResponse.data;
    savePendingCheckout({
      transactionCode: checkoutData.transactionCode,
      provider: selectedProvider,
      offerId: offer.id,
    });

    if (selectedProvider === "MOCK") {
      await finalizeMockCheckout(
        checkoutData.transactionCode,
        offer,
        successTitle,
        successMessage,
      );
      return;
    }

    if (!checkoutData.paymentUrl?.trim()) {
      popup.warning({
        title: copy("Transaction pending", "Giao dịch đang chờ"),
        message: copy(
          "Checkout was created but payment URL is empty.",
          "Checkout đã được tạo nhưng URL thanh toán đang trống.",
        ),
        description: `${copy("Transaction:", "Giao dịch:")} ${checkoutData.transactionCode}`,
      });
      return;
    }

    window.location.assign(checkoutData.paymentUrl);
  };

  const openCheckoutIntent = (
    triggerId: string,
    offer: PaymentOffer,
    successTitle: string,
    successMessage: string,
  ) => {
    setCheckoutIntent({
      triggerId,
      offer,
      successTitle,
      successMessage,
    });
  };

  const confirmCheckout = async () => {
    if (!checkoutIntent) {
      return;
    }

    try {
      setProcessingId(checkoutIntent.triggerId);
      const intent = checkoutIntent;
      setCheckoutIntent(null);

      await runCheckout(
        intent.offer,
        intent.successTitle,
        intent.successMessage,
        provider,
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleBuyVip = async (plan: TopupVipPlan) => {
    const offer = findVipOffer(plan);
    if (!offer) {
      popup.error({
        title: copy("Offer not available", "Ưu đãi không khả dụng"),
        message: copy(
          `No active VIP offer found for ${plan.title}.`,
          `Không tìm thấy ưu đãi VIP đang hoạt động cho ${plan.title}.`,
        ),
      });
      return;
    }

    const priceDisplay = `${offer.price.toLocaleString()} VND`;
    openCheckoutIntent(
      plan.id,
      offer,
      copy("VIP activated", "Đã kích hoạt VIP"),
      `${plan.title} • ${priceDisplay}`,
    );
  };

  const handleBuyCoins = async (pack: CheckoutCoinPack) => {
    const offer = pack.offer || findCoinOffer(pack);
    if (!offer) {
      popup.error({
        title: copy("Offer not available", "Ưu đãi không khả dụng"),
        message: copy(
          `No active coin offer found for ${pack.coins.toLocaleString()} coins.`,
          `Không tìm thấy ưu đãi xu đang hoạt động cho ${pack.coins.toLocaleString()} xu.`,
        ),
      });
      return;
    }

    const priceDisplay =
      offer.price > 0
        ? `${offer.price.toLocaleString()} VND`
        : copy("Free", "Miễn phí");

    openCheckoutIntent(
      pack.id,
      offer,
      copy("Top-up successful", "Nạp xu thành công"),
      `${pack.coins.toLocaleString()} coins • ${priceDisplay}`,
    );
  };

  const getPlanTitle = (plan: TopupVipPlan) => {
    if (plan.id === "month") return copy("1 Month", "1 tháng");
    if (plan.id === "year") return copy("1 Year", "1 năm");
    if (plan.id === "half-year") return copy("6 Months", "6 tháng");
    return plan.title;
  };

  const getPlanSubtitle = (plan: TopupVipPlan) => {
    if (plan.id === "month") return copy("Short Term", "Ngắn hạn");
    if (plan.id === "year") return copy("Elite Status", "Hạng cao cấp");
    if (plan.id === "half-year") return copy("Momentum", "Duy trì nhịp học");
    return plan.subtitle;
  };

  const getFeatureLabel = (feature: string) => {
    switch (feature) {
      case "Ad-free Experience":
        return copy("Ad-free Experience", "Trải nghiệm không quảng cáo");
      case "AI Writing Feedback":
        return copy("AI Writing Feedback", "Nhận xét bài viết bằng AI");
      case "Detailed Project Keys":
        return copy("Detailed Project Keys", "Mở khóa tính năng chi tiết");
      case "Exclusive Profile Frame":
        return copy("Exclusive Profile Frame", "Khung hồ sơ độc quyền");
      default:
        return feature;
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#155ca5]" />
          <p className="text-slate-600 font-semibold">
            {copy("Loading top-up options...", "Đang tải lựa chọn nạp tiền...")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-6 md:py-10 pb-24 md:pb-12 space-y-10 md:space-y-12">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#eaf1f9] min-h-[300px] flex items-center px-6 md:px-10 lg:px-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 right-10 w-72 h-72 rounded-full bg-[#1a5fa8]/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-8 w-80 h-80 rounded-full bg-[#7db5ff]/25 blur-3xl" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 w-full items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-1.5 text-xs tracking-[0.2em] uppercase font-bold text-[#155ca5]">
              <Crown className="w-4 h-4" />
              {copy("Premium Access", "Quyền truy cập Premium")}
            </span>

            <h1 className="text-4xl md:text-6xl font-black leading-[0.95] tracking-tight text-slate-900">
              {copy("Elevate Your", "Nâng tầm")}
              <br />
              {copy("Learning Journey", "hành trình học tập")}
            </h1>

            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur-sm px-5 py-3">
              <Coins className="w-5 h-5 text-[#155ca5]" />
              <p className="font-semibold text-slate-700">{heroSubtitle}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900">
              {copy("Choose Your Status", "Chọn gói của bạn")}
            </h2>
            <p className="text-slate-600 mt-2 max-w-xl">
              {copy(
                "Precision-engineered plans for learners who want a faster path to mastery.",
                "Các gói được thiết kế cho người học muốn tiến bộ nhanh hơn.",
              )}
            </p>
          </div>

          <div className="text-sm font-semibold text-slate-500">
            {visibleVipPlans.length + visibleCoinPacks.length}{" "}
            {copy("active offers available", "ưu đãi đang khả dụng")}
          </div>
        </div>

        {visibleVipPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {visibleVipPlans.map((plan) => {
              const apiOffer = findVipOffer(plan);
              const price = apiOffer?.price || 0;
              const isProcessing = processingId === plan.id;

              return (
                <article
                  key={plan.id}
                  className={`rounded-[2rem] p-8 lg:p-10 transition-transform duration-300 hover:-translate-y-1 ${
                    plan.highlighted
                      ? "bg-white shadow-[0px_20px_40px_rgba(26,95,168,0.12)]"
                      : "bg-[#eef3f9]"
                  }`}
                >
                  <div className="mb-8">
                    <p
                      className={`text-xs uppercase tracking-[0.18em] font-bold ${plan.highlighted ? "text-[#155ca5]" : "text-slate-500"}`}
                    >
                      {getPlanSubtitle(plan)}
                    </p>
                    <h3 className="text-3xl font-black text-slate-900 mt-2">
                      {getPlanTitle(plan)}
                    </h3>
                    <p className="mt-3 text-5xl font-black tracking-tight text-slate-900">
                      {price.toLocaleString()}
                      <span className="text-lg text-slate-500 font-semibold">
                        {" "}
                        VND
                      </span>
                    </p>
                    {apiOffer?.description && (
                      <p className="mt-2 text-sm font-bold text-[#155ca5]">
                        {apiOffer.description}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 text-slate-700"
                      >
                        <CheckCircle2
                          className={`w-5 h-5 ${plan.highlighted ? "text-[#155ca5]" : "text-slate-400"}`}
                        />
                        <span
                          className={`${plan.highlighted ? "font-semibold" : "font-medium"}`}
                        >
                          {getFeatureLabel(feature)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handleBuyVip(plan)}
                    disabled={isProcessing}
                    className={`w-full py-3 rounded-xl font-bold transition-colors ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-[#1a5fa8] to-[#005095] text-white"
                        : "bg-white text-slate-900 hover:bg-slate-100"
                    } ${isProcessing ? "opacity-70" : ""}`}
                  >
                    {isProcessing
                      ? copy("Processing...", "Đang xử lý...")
                      : plan.highlighted
                        ? copy("Get VIP Gold", "Nhận VIP Gold")
                        : copy("Select Plan", "Chọn gói")}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-slate-600 font-medium">
            {copy(
              "No active VIP offers available right now.",
              "Hiện chưa có ưu đãi VIP đang hoạt động.",
            )}
          </div>
        )}
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-4xl font-black tracking-tight text-slate-900">
            {copy("Refill Coins", "Nạp xu")}
          </h2>
          <div className="h-[2px] flex-1 bg-slate-300/50" />
        </div>

        {visibleCoinPacks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visibleCoinPacks.map((pack) => {
              const price = pack.offer?.price || 0;
              const isProcessing = processingId === pack.id;

              return (
                <article
                  key={pack.id}
                  className={`rounded-[1.5rem] p-6 text-center flex flex-col items-center bg-[#f1f4f8]`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-white text-[#155ca5]`}
                  >
                    <PackIcon icon={pack.icon} />
                  </div>

                  <p
                    className={`text-xs uppercase tracking-[0.18em] font-bold mb-2 text-slate-500`}
                  >
                    {pack.label}
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 mb-5">
                    {pack.coins.toLocaleString()} {copy("Coins", "xu")}
                  </h3>

                  <button
                    type="button"
                    onClick={() => handleBuyCoins(pack)}
                    disabled={isProcessing}
                    className="mt-auto w-full rounded-xl py-3 bg-gradient-to-r from-[#1a5fa8] to-[#005095] text-white font-bold hover:brightness-105 transition-all disabled:opacity-70"
                  >
                    {isProcessing
                      ? copy("Processing...", "Đang xử lý...")
                      : price > 0
                        ? `${price.toLocaleString()} VND`
                        : copy("Free", "Miễn phí")}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-slate-600 font-medium">
            {copy(
              "No active coin offers available right now.",
              "Hiện chưa có ưu đãi xu đang hoạt động.",
            )}
          </div>
        )}
      </section>

      <section className="rounded-[1.5rem] bg-gradient-to-r from-[#1a5fa8] to-[#005095] text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Flame className="w-7 h-7 mt-1" />
          <div>
            <h3 className="text-2xl font-black mb-1">
              {copy(
                "Need More Coins Without Paying?",
                "Muốn kiếm thêm xu miễn phí?",
              )}
            </h3>
            <p className="text-white/90">
              {copy(
                "Complete quests, daily lessons, and revision tests to stack coins faster.",
                "Hoàn thành nhiệm vụ, bài học hằng ngày và bài ôn tập để tích xu nhanh hơn.",
              )}
            </p>
          </div>
        </div>

        <Link
          to="/quests"
          className="inline-flex items-center justify-center rounded-xl bg-white text-[#155ca5] px-5 py-3 font-bold hover:bg-slate-100 transition-colors whitespace-nowrap"
        >
          {copy("View Quests", "Xem nhiệm vụ")}
        </Link>
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 font-semibold">
          {error}
        </div>
      )}

      {checkoutIntent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6">
            <h3 className="text-2xl font-black text-slate-900">
              {copy("Choose payment method", "Chọn phương thức thanh toán")}
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              {copy(
                "Your order will create a PENDING transaction first, then redirect to the selected payment gateway.",
                "Đơn hàng sẽ tạo giao dịch PENDING trước, sau đó chuyển tới cổng thanh toán bạn chọn.",
              )}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              {PAYMENT_PROVIDER_OPTIONS.map((option) => {
                const isActive = provider === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProvider(option.value)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold border transition-colors ${
                      isActive
                        ? "border-[#155ca5] bg-[#edf5ff] text-[#155ca5]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {provider === "MOCK" && (
              <p className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800">
                {copy(
                  "MOCK is only for local testing.",
                  "MOCK chỉ dùng cho local test.",
                )}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCheckoutIntent(null)}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 font-semibold hover:bg-slate-50"
              >
                {copy("Cancel", "Hủy")}
              </button>
              <button
                type="button"
                onClick={confirmCheckout}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#1a5fa8] to-[#005095] px-4 py-2.5 text-white font-bold hover:brightness-105"
              >
                {copy("Continue", "Tiếp tục")}
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationPopup
        isOpen={popup.notification.isOpen}
        type={popup.notification.type}
        title={popup.notification.title}
        message={popup.notification.message}
        description={popup.notification.description}
        onClose={popup.close}
        onConfirm={popup.notification.onConfirm}
        confirmText={popup.notification.confirmText}
        cancelText={popup.notification.cancelText}
        showCancelButton={popup.notification.showCancelButton}
        autoClose={popup.notification.autoClose}
        autoCloseDuration={popup.notification.autoCloseDuration}
      />
    </main>
  );
}
