import { useEffect, useState } from "react";
import {
  Coins,
  Flame,
  Loader2,
  Palette,
  Sparkles,
  Users,
} from "lucide-react";
import {
  getCoinLeaderboard,
  getCollectorLeaderboard,
  getExpLeaderboard,
} from "@/api";
import type {
  CoinLeaderboardEntryResponse,
  CollectorLeaderboardEntryResponse,
  ExpLeaderboardEntryResponse,
} from "@/api/types";
import { useLanguage } from "@/context/LanguageContext";

type Tab = "coin" | "exp" | "collection";

export function Leaderboard() {
  const { copy } = useLanguage();
  const [coinLeaderboard, setCoinLeaderboard] = useState<
    CoinLeaderboardEntryResponse[]
  >([]);
  const [collectorLeaderboard, setCollectorLeaderboard] = useState<
    CollectorLeaderboardEntryResponse[]
  >([]);
  const [expLeaderboard, setExpLeaderboard] = useState<
    ExpLeaderboardEntryResponse[]
  >([]);
  const [activeTab, setActiveTab] = useState<Tab>("coin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [coinResponse, expResponse, collectorResponse] = await Promise.all([
        getCoinLeaderboard(10),
        getExpLeaderboard(10),
        getCollectorLeaderboard(10),
      ]);

      if (!coinResponse.success) {
        setError(
          coinResponse.error?.message ||
            copy(
              "Failed to load coin leaderboard",
              "Không thể tải bảng xếp hạng xu",
            ),
        );
        return;
      }

      if (!expResponse.success) {
        setError(
          expResponse.error?.message ||
            copy(
              "Failed to load exp leaderboard",
              "Không thể tải bảng xếp hạng EXP",
            ),
        );
        return;
      }

      if (!collectorResponse.success) {
        setError(
          collectorResponse.error?.message ||
            copy(
              "Failed to load collector leaderboard",
              "Không thể tải bảng xếp hạng sưu tập",
            ),
        );
        return;
      }

      setCoinLeaderboard(coinResponse.data?.leaderboard || []);
      setExpLeaderboard(expResponse.data?.leaderboard || []);
      setCollectorLeaderboard(collectorResponse.data?.leaderboard || []);
    } catch (err) {
      console.error("Error loading leaderboard:", err);
      setError(
        copy("Failed to load leaderboard", "Không thể tải bảng xếp hạng"),
      );
    } finally {
      setLoading(false);
    }
  };

  const activeData =
    activeTab === "coin"
      ? coinLeaderboard
      : activeTab === "exp"
        ? expLeaderboard
        : collectorLeaderboard;

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#155ca5]" />
          <p className="font-medium text-gray-600">
            {copy("Loading leaderboard...", "Đang tải bảng xếp hạng...")}
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-6 py-10">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-bold text-red-600">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="mt-4 rounded-xl bg-red-600 px-6 py-2 font-bold text-white"
          >
            {copy("Retry", "Thử lại")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 overflow-x-hidden px-4 py-6 pb-24 sm:space-y-8 sm:px-6 sm:py-10 md:pb-12">
      <section className="space-y-5 rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_48px_rgba(45,88,133,0.12)] backdrop-blur-md sm:p-7">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#155ca5] sm:text-xs">
            {copy("Rankings", "Xếp hạng")}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#155ca5] sm:text-4xl lg:text-5xl">
            {copy("Leaderboard", "Bảng xếp hạng")}
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-gray-600 sm:text-lg">
            {copy(
              "Top 10 Coins, EXP and Collection.",
              "Top 10 xu, EXP và bộ sưu tập.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-3 rounded-2xl bg-white p-2 shadow-sm sm:inline-grid sm:w-auto">
          <TabButton
            active={activeTab === "coin"}
            onClick={() => setActiveTab("coin")}
            icon={<Coins className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />}
          >
            Coin
          </TabButton>

          <TabButton
            active={activeTab === "exp"}
            onClick={() => setActiveTab("exp")}
            icon={<Sparkles className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />}
          >
            EXP
          </TabButton>

          <TabButton
            active={activeTab === "collection"}
            onClick={() => setActiveTab("collection")}
            icon={<Palette className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />}
          >
            {copy("Collection", "Sưu tập")}
          </TabButton>
        </div>
      </section>

      <section className="space-y-8">
        <p className="sr-only">
          {copy(
            "Top 10 Coins, EXP and Collection.",
            "Top 10 xu, EXP và bộ sưu tập.",
          )}
        </p>

        <div className="space-y-6 md:hidden">
          {activeData.map((entry) => (
            <MobileLeaderboardCard
              key={`${activeTab}-${entry.userId}`}
              entry={entry}
              tab={activeTab}
            />
          ))}
        </div>

        <div className="hidden md:block">
          {activeTab === "coin" ? (
            <DesktopCoinTable data={coinLeaderboard} />
          ) : activeTab === "exp" ? (
            <DesktopExpTable data={expLeaderboard} />
          ) : (
            <DesktopCollectionTable data={collectorLeaderboard} />
          )}
        </div>

        {coinLeaderboard.length === 0 &&
          expLeaderboard.length === 0 &&
          collectorLeaderboard.length === 0 && (
            <section className="rounded-[2rem] bg-white px-4 py-12 text-center shadow-sm">
              <Users className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-lg text-gray-500">
                {copy("No leaderboard data yet", "Chưa có dữ liệu xếp hạng")}
              </p>
            </section>
          )}
      </section>
    </main>
  );
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
      className={`flex min-w-0 items-center justify-center gap-2 rounded-[1.5rem] px-3 py-4 text-sm font-black transition-all sm:text-base md:px-5 md:py-3 ${
        active
          ? "bg-[#155ca5] text-white shadow-lg"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}

function MobileLeaderboardCard({
  entry,
  tab,
}: {
  entry:
    | CoinLeaderboardEntryResponse
    | ExpLeaderboardEntryResponse
    | CollectorLeaderboardEntryResponse;
  tab: Tab;
}) {
  const { copy } = useLanguage();
  const isCurrentUser = !!entry.currentUser;
  const isFirst = entry.rank === 1;

  return (
    <article
      className={`relative overflow-hidden rounded-[2rem] px-6 py-6 shadow-sm ${
        isCurrentUser
          ? "bg-[#155ca5] text-white"
          : isFirst
            ? "border-2 border-orange-200 bg-white"
            : "bg-white"
      }`}
    >
      {isCurrentUser && (
        <span className="absolute right-8 top-0 rounded-b-2xl bg-white/80 px-6 py-1 text-sm font-black tracking-[0.25em] text-[#155ca5]">
          {copy("YOU", "BẠN")}
        </span>
      )}

      <div className="flex min-w-0 items-center gap-5">
        <div
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-2xl font-black ${
            isCurrentUser
              ? "bg-white/20 text-white"
              : isFirst
                ? "bg-orange-100 text-amber-800"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          {entry.rank}
        </div>

        <img
          src={entry.avatar ?? undefined}
          alt={entry.username}
          className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-slate-100"
        />

        <div className="min-w-0 flex-1">
          <h3
            className={`truncate text-2xl font-black ${
              isCurrentUser ? "text-white" : "text-slate-950"
            }`}
          >
            {entry.username}
          </h3>

          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2 text-base font-bold">
            {tab === "coin" && "coin" in entry && (
              <>
                <Metric
                  icon={<Coins className="h-5 w-5" />}
                  value={entry.coin.toLocaleString()}
                  className={isCurrentUser ? "text-white" : "text-[#155ca5]"}
                />
                <Metric
                  value={`${entry.score}`}
                  className={isCurrentUser ? "text-white/90" : "text-slate-700"}
                />
                <FlameMetric value={entry.streak} light={isCurrentUser} />
              </>
            )}

            {tab === "exp" && "exp" in entry && (
              <>
                <Metric
                  icon={<Sparkles className="h-5 w-5" />}
                  value={entry.exp.toLocaleString()}
                  className={isCurrentUser ? "text-white" : "text-[#155ca5]"}
                />
                <FlameMetric value={entry.streak} light={isCurrentUser} />
              </>
            )}

            {tab === "collection" && "collectibleCount" in entry && (
              <>
                <Metric
                  icon={<Palette className="h-5 w-5" />}
                  value={entry.collectibleCount}
                  className={isCurrentUser ? "text-white" : "text-[#155ca5]"}
                />
                <Metric
                  value={`${entry.categoryCount} ${copy("cat", "loại")}`}
                />
                <Metric
                  value={`${entry.avatarCount} ${copy("ava", "avatar")}`}
                />
                <Metric value={`${entry.backgroundCount} bg`} />
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function Metric({
  icon,
  value,
  className = "text-slate-700",
}: {
  icon?: React.ReactNode;
  value: string | number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {icon}
      {value}
    </span>
  );
}

function FlameMetric({
  value,
  light = false,
}: {
  value: string | number;
  light?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${
        light ? "text-orange-100" : "text-amber-800"
      }`}
    >
      <Flame className="h-5 w-5 text-orange-500" fill="#f97316" />
      {value}
    </span>
  );
}

function DesktopCoinTable({ data }: { data: CoinLeaderboardEntryResponse[] }) {
  const { copy } = useLanguage();
  return (
    <DesktopTable
      headers={[
        copy("Rank", "Hạng"),
        copy("User", "Người dùng"),
        copy("Coin", "Xu"),
        copy("Score", "Điểm"),
        copy("Streak", "Chuỗi ngày"),
      ]}
    >
      {data.map((entry) => (
        <tr
          key={entry.userId}
          className={entry.currentUser ? "bg-[#155ca5]/10" : "hover:bg-gray-50"}
        >
          <Td>#{entry.rank}</Td>
          <UserTd entry={entry} />
          <Td className="text-[#155ca5]">{entry.coin.toLocaleString()}</Td>
          <Td>{entry.score}</Td>
          <Td>
            <FlameMetric value={entry.streak} />
          </Td>
        </tr>
      ))}
    </DesktopTable>
  );
}

function DesktopExpTable({ data }: { data: ExpLeaderboardEntryResponse[] }) {
  const { copy } = useLanguage();
  return (
    <DesktopTable
      headers={[
        copy("Rank", "Hạng"),
        copy("User", "Người dùng"),
        "EXP",
        copy("Streak", "Chuỗi ngày"),
      ]}
    >
      {data.map((entry) => (
        <tr
          key={entry.userId}
          className={entry.currentUser ? "bg-[#155ca5]/10" : "hover:bg-gray-50"}
        >
          <Td>#{entry.rank}</Td>
          <UserTd entry={entry} />
          <Td className="text-[#155ca5]">{entry.exp.toLocaleString()}</Td>
          <Td>
            <FlameMetric value={entry.streak} />
          </Td>
        </tr>
      ))}
    </DesktopTable>
  );
}

function DesktopCollectionTable({
  data,
}: {
  data: CollectorLeaderboardEntryResponse[];
}) {
  const { copy } = useLanguage();
  return (
    <DesktopTable
      headers={[
        copy("Rank", "Hạng"),
        copy("User", "Người dùng"),
        copy("Items", "Vật phẩm"),
        copy("Categories", "Danh mục"),
        "Avatar",
        copy("Background", "Nền"),
      ]}
    >
      {data.map((entry) => (
        <tr
          key={entry.userId}
          className={entry.currentUser ? "bg-[#155ca5]/10" : "hover:bg-gray-50"}
        >
          <Td>#{entry.rank}</Td>
          <UserTd entry={entry} />
          <Td className="text-[#155ca5]">{entry.collectibleCount}</Td>
          <Td>{entry.categoryCount}</Td>
          <Td>{entry.avatarCount}</Td>
          <Td>{entry.backgroundCount}</Td>
        </tr>
      ))}
    </DesktopTable>
  );
}

function DesktopTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <table className="w-full table-fixed">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-4 text-left text-xs font-black uppercase text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-4 text-sm font-bold ${className}`}>{children}</td>
  );
}

function UserTd({
  entry,
}: {
  entry: {
    avatar?: string | null;
    username: string;
    currentUser?: boolean;
  };
}) {
  const { copy } = useLanguage();
  return (
    <td className="px-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={entry.avatar ?? undefined}
          alt={entry.username}
          className="h-9 w-9 rounded-full object-cover"
        />
        <span className="truncate text-sm font-black">
          {entry.username}
          {entry.currentUser && (
            <span className="ml-2 rounded-full bg-[#155ca5] px-2 py-0.5 text-[10px] text-white">
              {copy("YOU", "BẠN")}
            </span>
          )}
        </span>
      </div>
    </td>
  );
}
