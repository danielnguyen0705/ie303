import { useState, useEffect } from "react";
import {
  Target,
  Trophy,
  Star,
  Gift,
  Lock,
  CheckCircle,
  Loader2,
  Zap,
  Coins,
  Package,
  X,
} from "lucide-react";
import { getAllQuests, claimQuestReward, getAllAchievements } from "@/api";
import type { Quest, Achievement } from "@/api/quests";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export function Quests() {
  const { copy } = useLanguage();
  const { refreshCurrentUser } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    "daily" | "weekly" | "achievements"
  >("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingQuest, setClaimingQuest] = useState<string | null>(null);
  const [claimNotice, setClaimNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadQuestsAndAchievements();
  }, []);

  const loadQuestsAndAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      const [questsResponse, achievementsResponse] = await Promise.all([
        getAllQuests(),
        getAllAchievements(),
      ]);

      if (questsResponse.success) setQuests(questsResponse.data ?? []);
      if (achievementsResponse.success)
        setAchievements(achievementsResponse.data ?? []);
    } catch (err) {
      console.error("Error loading quests:", err);
      setError(copy("Failed to load quests and achievements", "Không thể tải nhiệm vụ và huy hiệu"));
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (questId: string) => {
    try {
      setClaimingQuest(questId);
      const response = await claimQuestReward({ questId });

      if (response.success && response.data) {
        const claimedQuest = response.data;

        setQuests((prev) =>
          prev.map((q) =>
            q.id === questId
              ? {
                  ...q,
                  ...claimedQuest.quest,
                  status: "claimed" as const,
                }
              : q,
          ),
        );

        void refreshCurrentUser(false);

        setClaimNotice({
          kind: "success",
          message: copy(
            buildRewardMessage(
              claimedQuest.rewards.xp,
              claimedQuest.rewards.coins,
              claimedQuest.rewards.items,
            ),
            buildRewardMessage(
              claimedQuest.rewards.xp,
              claimedQuest.rewards.coins,
              claimedQuest.rewards.items,
              true,
            ),
          ),
        });
      } else {
        setClaimNotice({
          kind: "error",
          message: copy(
            "Could not claim reward. Please try again.",
            "Không thể nhận thưởng. Vui lòng thử lại.",
          ),
        });
      }
    } catch (err) {
      console.error("Error claiming reward:", err);
      setClaimNotice({
        kind: "error",
        message: copy(
          "Could not claim reward. Please try again.",
          "Không thể nhận thưởng. Vui lòng thử lại.",
        ),
      });
    } finally {
      setClaimingQuest(null);
    }
  };

  const filteredQuests = quests.filter((q) => {
    if (selectedTab === "daily") return q.type === "daily";
    if (selectedTab === "weekly") return q.type === "weekly";
    return false;
  });

  const getProgressColor = (progress: number, target: number) => {
    const percentage = (progress / target) * 100;
    if (percentage >= 100) return "bg-[#27ae60]";
    if (percentage >= 50) return "bg-[#f39c12]";
    return "bg-[#155ca5]";
  };

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#155ca5]" />
          <p className="font-medium text-gray-600">{copy("Loading quests...", "Đang tải nhiệm vụ...")}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-bold text-red-600">{error}</p>
          <button
            onClick={loadQuestsAndAchievements}
            className="mt-4 rounded-xl bg-red-600 px-6 py-2 font-bold text-white transition-colors hover:bg-red-700"
          >
            {copy("Retry", "Thử lại")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 overflow-x-hidden px-4 py-5 pb-24 sm:space-y-8 sm:px-6 sm:py-8 md:pb-12">
      <section className="space-y-5">
        {claimNotice && (
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
              claimNotice.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <div
              className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                claimNotice.kind === "success" ? "bg-emerald-100" : "bg-red-100"
              }`}
            >
              {claimNotice.kind === "success" ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <Gift className="h-5 w-5 text-red-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">
                {claimNotice.kind === "success"
                  ? copy("Reward claimed", "Đã nhận thưởng")
                  : copy("Claim failed", "Nhận thưởng thất bại")}
              </p>
              <p className="mt-1 text-sm leading-5">{claimNotice.message}</p>
            </div>

            <button
              type="button"
              onClick={() => setClaimNotice(null)}
              className="rounded-full p-1 transition-colors hover:bg-black/5"
              aria-label={copy("Close notification", "Đóng thông báo")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#155ca5] sm:text-xs">
            {copy("Challenges", "Thử thách")}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#155ca5] sm:text-4xl lg:text-5xl">
            {copy("Quests & Badges", "Nhiệm vụ & huy hiệu")}
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-gray-600 sm:text-lg">
            {copy(
              "Complete daily quests to earn extra coins, EXP, and bonus items.",
              "Hoàn thành nhiệm vụ mỗi ngày để nhận thêm coin, EXP và vật phẩm thưởng.",
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium leading-5 text-amber-900 sm:text-sm">
          {copy(
            "Daily quests refresh automatically every day. Claim rewards before the day ends.",
            "Nhiệm vụ mỗi ngày tự làm mới. Hãy nhận thưởng trước khi ngày kết thúc.",
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-2 shadow-sm sm:inline-grid sm:w-auto">
          <TabButton
            active={selectedTab === "daily"}
            onClick={() => setSelectedTab("daily")}
            icon={<Target className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />}
          >
            {copy("Daily", "Hằng ngày")}
          </TabButton>

          <TabButton
            active={selectedTab === "weekly"}
            onClick={() => setSelectedTab("weekly")}
            icon={<Star className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />}
          >
            {copy("Weekly", "Hằng tuần")}
          </TabButton>

          <TabButton
            active={selectedTab === "achievements"}
            onClick={() => setSelectedTab("achievements")}
            icon={<Trophy className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />}
          >
            {copy("Badges", "Huy hiệu")}
          </TabButton>
        </div>
      </section>

      {selectedTab !== "achievements" && (
        <section className="space-y-5">
          {filteredQuests.length === 0 && (
            <EmptyState
              icon={
                <Target className="mx-auto mb-4 h-14 w-14 text-gray-300 sm:h-16 sm:w-16" />
              }
              text={copy(
                "No quests are available right now.",
                "Hiện chưa có nhiệm vụ nào cho hôm nay.",
              )}
            />
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {filteredQuests.map((quest) => {
              const isCompleted = quest.status === "completed";
              const isClaimed = quest.status === "claimed";
              const isClaiming = claimingQuest === quest.id;

              return (
                <article
                  key={quest.id}
                  className={`min-w-0 rounded-3xl bg-white p-4 shadow-sm transition-all sm:p-6 ${
                    isCompleted && !isClaimed
                      ? "border-2 border-[#27ae60] shadow-lg"
                      : "border border-transparent"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                        isClaimed ? "bg-gray-200" : "bg-[#155ca5]/10"
                      }`}
                    >
                      {isClaimed ? (
                        <CheckCircle className="h-6 w-6 text-gray-400" />
                      ) : (
                        <Target
                          className={`h-6 w-6 ${
                            isCompleted ? "text-[#27ae60]" : "text-[#155ca5]"
                          }`}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-black text-slate-900 sm:text-lg">
                        {quest.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-600">
                        {quest.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{copy("Progress", "Tiến độ")}</span>
                      <span className="font-black">
                        {quest.progress}/{quest.target}
                      </span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(
                          quest.progress,
                          quest.target,
                        )}`}
                        style={{
                          width: `${Math.min((quest.progress / quest.target) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3 text-sm font-black">
                      <Reward
                        icon={<Zap className="h-4 w-4" fill="#155ca5" />}
                        className="text-[#155ca5]"
                      >
                        +{quest.xpReward} XP
                      </Reward>

                      <Reward
                        icon={<Coins className="h-4 w-4" fill="#f1c40f" />}
                        className="text-[#f1c40f]"
                      >
                        +{quest.coinsReward}
                      </Reward>

                      {quest.rewardItems?.length ? (
                        <Reward
                          icon={<Package className="h-4 w-4" />}
                          className="text-emerald-600"
                        >
                          +{quest.rewardItems
                            .map((item) => `${item.name} x${item.quantity}`)
                            .join(", ")}
                        </Reward>
                      ) : null}
                    </div>

                    {isClaimed ? (
                      <span className="text-sm font-black text-gray-500">
                        {copy("Claimed", "Đã nhận")} ✓
                      </span>
                    ) : isCompleted ? (
                      <button
                        onClick={() => handleClaimReward(quest.id)}
                        disabled={isClaiming}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#27ae60] px-4 py-3 text-sm font-black text-white transition-colors hover:bg-[#229954] disabled:opacity-50 sm:w-auto sm:py-2"
                      >
                        {isClaiming ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {copy("Claiming...", "Đang nhận...")}
                          </>
                        ) : (
                          <>
                            <Gift className="h-4 w-4" />
                            {copy("Claim Reward", "Nhận thưởng")}
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-sm font-black text-gray-500">
                        {copy(
                          `${quest.target - quest.progress} more to go`,
                          `Còn ${quest.target - quest.progress} nữa`,
                        )}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {selectedTab === "achievements" && (
        <section className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {achievements.map((achievement) => {
              const isUnlocked = !achievement.isLocked;
              const progressPercentage = achievement.requirement
                ? ((achievement.progress || 0) / achievement.requirement) * 100
                : 0;

              return (
                <article
                  key={achievement.id}
                  className={`min-w-0 rounded-3xl bg-white p-5 text-center shadow-sm transition-all sm:p-6 ${
                    isUnlocked
                      ? "border-2 border-[#ffd700]"
                      : "border border-transparent opacity-75"
                  }`}
                >
                  <div
                    className={`mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full ${
                      isUnlocked ? "bg-[#ffd700]/20" : "bg-gray-200"
                    }`}
                  >
                    {isUnlocked ? (
                      <Trophy className="h-10 w-10 text-[#ffd700]" />
                    ) : (
                      <Lock className="h-10 w-10 text-gray-400" />
                    )}
                  </div>

                  <h3 className="truncate text-lg font-black text-slate-900">
                    {achievement.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-600">
                    {achievement.description}
                  </p>

                  {!isUnlocked && achievement.requirement && (
                    <div className="mt-5 space-y-2 text-left">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{copy("Progress", "Tiến độ")}</span>
                        <span className="font-black">
                          {achievement.progress || 0}/{achievement.requirement}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-[#155ca5] transition-all"
                          style={{
                            width: `${Math.min(progressPercentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {isUnlocked && achievement.unlockedAt && (
                    <div className="mt-5 border-t border-gray-200 pt-4">
                      <p className="text-xs text-gray-500">
                        {copy("Unlocked on", "Mở khóa vào")}{" "}
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {achievements.length === 0 && (
            <EmptyState
              icon={
                <Trophy className="mx-auto mb-4 h-14 w-14 text-gray-300 sm:h-16 sm:w-16" />
              }
              text={copy("No badges unlocked yet.", "Chưa có huy hiệu nào được mở khóa.")}
            />
          )}
        </section>
      )}
    </main>
  );
}

function buildRewardMessage(
  xp: number,
  coins: number,
  items?: Array<{ name: string; quantity: number }>,
  vietnamese = false,
): string {
  const itemText = items?.length
    ? ` ${vietnamese ? "và" : "and"} ${items
        .map((item) => `${item.name} x${item.quantity}`)
        .join(", ")}`
    : "";

  return vietnamese
    ? `Đã nhận ${xp} XP, ${coins} xu${itemText}!`
    : `Claimed ${xp} XP, ${coins} coins${itemText}!`;
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-xs font-black transition-all sm:gap-2 sm:px-5 sm:text-sm ${
        active
          ? "bg-[#155ca5] text-white shadow-md"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}

function Reward({
  icon,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-3xl bg-white px-4 py-12 text-center shadow-sm">
      {icon}
      <p className="text-base text-gray-500 sm:text-lg">{text}</p>
    </div>
  );
}
