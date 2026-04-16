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
import { getCoinBalance } from "@/api";
import type {
  TopupBillingCycle,
  TopupCoinPack,
  TopupCoinPackIcon,
  TopupVipPlan,
} from "@/api/types";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";

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

const COIN_PACKS: TopupCoinPack[] = [
  {
    id: "starter",
    label: "Starter Pack",
    coins: 500,
    priceUsd: 4.99,
    icon: "wallet",
  },
  {
    id: "popular",
    label: "Popular",
    coins: 1200,
    priceUsd: 9.99,
    icon: "coins",
  },
  {
    id: "big-stacks",
    label: "Big Stacks",
    coins: 2500,
    priceUsd: 19.99,
    icon: "gem",
    highlighted: true,
  },
  {
    id: "ultimate",
    label: "Ultimate",
    coins: 6000,
    priceUsd: 44.99,
    icon: "sparkles",
  },
];

const toUsd = (value: number): string => `$${value.toFixed(2)}`;

const planPrice = (plan: TopupVipPlan, cycle: TopupBillingCycle): number =>
  cycle === "annual"
    ? (plan.annualPrice ?? plan.monthlyPrice)
    : plan.monthlyPrice;

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
  const [balance, setBalance] = useState(0);
  const [billingCycle, setBillingCycle] = useState<TopupBillingCycle>("annual");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const popup = useNotificationPopup({
    autoClose: true,
    autoCloseDuration: 2500,
  });

  useEffect(() => {
    const loadBalance = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getCoinBalance();
        if (!response.success) {
          setError(response.error?.message || "Failed to load coin balance");
          return;
        }

        setBalance(response.data?.balance || 0);
      } catch (err) {
        console.error("Error loading coin balance:", err);
        setError("Failed to load coin balance");
      } finally {
        setLoading(false);
      }
    };

    loadBalance();
  }, []);

  const heroSubtitle = useMemo(() => {
    if (loading) return "Syncing your wallet...";
    if (error) return "Continue with curated VIP plans and coin bundles.";
    return `Your current balance is ${balance.toLocaleString()} coins.`;
  }, [balance, error, loading]);

  const handleBuyVip = async (plan: TopupVipPlan) => {
    try {
      setProcessingId(plan.id);
      const selectedPrice = planPrice(plan, billingCycle);
      const cycleLabel = billingCycle === "annual" ? "annual" : "monthly";

      popup.success({
        title: "VIP plan selected",
        message: `${plan.title} (${cycleLabel}) • ${toUsd(selectedPrice)}/mo`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleBuyCoins = async (pack: TopupCoinPack) => {
    try {
      setProcessingId(pack.id);

      popup.info({
        title: "Top-up request created",
        message: `${pack.coins.toLocaleString()} coins • ${toUsd(pack.priceUsd)}`,
        description: "Payment gateway is being integrated in this iteration.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#155ca5]" />
          <p className="text-slate-600 font-semibold">
            Loading top-up options...
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
              Premium Access
            </span>

            <h1 className="text-4xl md:text-6xl font-black leading-[0.95] tracking-tight text-slate-900">
              Elevate Your
              <br />
              Learning Journey
            </h1>

            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur-sm px-5 py-3">
              <Coins className="w-5 h-5 text-[#155ca5]" />
              <p className="font-semibold text-slate-700">{heroSubtitle}</p>
            </div>
          </div>

          <div className="hidden lg:flex justify-center">
            <div className="relative w-72 h-52 rounded-[1.75rem] bg-gradient-to-br from-[#1a5fa8] via-[#0f4f92] to-[#0a3f76] shadow-[0px_20px_40px_rgba(26,95,168,0.2)] p-4">
              <div className="absolute inset-0 rounded-[1.75rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
              <div className="relative h-full rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm flex flex-col justify-between p-6 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wider">
                    UIFIVE VIP
                  </span>
                  <BadgeCheck className="w-5 h-5" />
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-white/80">
                    Coin Wallet
                  </div>
                  <div className="text-3xl font-black mt-1">
                    {balance.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center justify-between text-white/80 text-sm">
                  <span>Premium Tier</span>
                  <span>Gold</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900">
              Choose Your Status
            </h2>
            <p className="text-slate-600 mt-2 max-w-xl">
              Precision-engineered plans for learners who want a faster path to
              mastery.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-white/70 rounded-full p-1.5">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                billingCycle === "monthly"
                  ? "bg-white text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                billingCycle === "annual"
                  ? "bg-[#155ca5] text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {VIP_PLANS.map((plan) => {
            const price = planPrice(plan, billingCycle);
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
                    {plan.subtitle}
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">
                    {plan.title}
                  </h3>
                  <p className="mt-3 text-5xl font-black tracking-tight text-slate-900">
                    ${price}
                    <span className="text-lg text-slate-500 font-semibold">
                      /mo
                    </span>
                  </p>
                  {plan.note && billingCycle === "annual" && (
                    <p className="mt-2 text-sm font-bold text-[#155ca5]">
                      {plan.note}
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
                        {feature}
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
                    ? "Processing..."
                    : plan.highlighted
                      ? "Get VIP Gold"
                      : "Select Plan"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-4xl font-black tracking-tight text-slate-900">
            Refill Coins
          </h2>
          <div className="h-[2px] flex-1 bg-slate-300/50" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {COIN_PACKS.map((pack) => {
            const isProcessing = processingId === pack.id;

            return (
              <article
                key={pack.id}
                className={`rounded-[1.5rem] p-6 text-center flex flex-col items-center ${
                  pack.highlighted
                    ? "bg-white shadow-[0px_20px_35px_rgba(26,95,168,0.1)]"
                    : "bg-[#f1f4f8]"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                    pack.highlighted
                      ? "bg-gradient-to-br from-[#1a5fa8] to-[#005095] text-white"
                      : "bg-white text-[#155ca5]"
                  }`}
                >
                  <PackIcon icon={pack.icon} />
                </div>

                <p
                  className={`text-xs uppercase tracking-[0.18em] font-bold mb-2 ${
                    pack.highlighted ? "text-[#155ca5]" : "text-slate-500"
                  }`}
                >
                  {pack.label}
                </p>
                <h3 className="text-3xl font-black text-slate-900 mb-5">
                  {pack.coins.toLocaleString()} Coins
                </h3>

                <button
                  type="button"
                  onClick={() => handleBuyCoins(pack)}
                  disabled={isProcessing}
                  className="mt-auto w-full rounded-xl py-3 bg-gradient-to-r from-[#1a5fa8] to-[#005095] text-white font-bold hover:brightness-105 transition-all disabled:opacity-70"
                >
                  {isProcessing
                    ? "Processing..."
                    : `${toUsd(pack.priceUsd)} Buy`}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-gradient-to-r from-[#1a5fa8] to-[#005095] text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Flame className="w-7 h-7 mt-1" />
          <div>
            <h3 className="text-2xl font-black mb-1">
              Need More Coins Without Paying?
            </h3>
            <p className="text-white/90">
              Complete quests, daily lessons, and revision tests to stack coins
              faster.
            </p>
          </div>
        </div>

        <Link
          to="/quests"
          className="inline-flex items-center justify-center rounded-xl bg-white text-[#155ca5] px-5 py-3 font-bold hover:bg-slate-100 transition-colors whitespace-nowrap"
        >
          View Quests
        </Link>
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 font-semibold">
          {error}
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
