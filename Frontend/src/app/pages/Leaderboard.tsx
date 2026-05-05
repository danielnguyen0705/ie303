import { useEffect, useState } from "react";
import {
  Coins,
  Flame,
  Loader2,
  Palette,
  Settings,
  Sparkles,
  Trophy,
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

type Tab = "coin" | "exp" | "collection";

export function Leaderboard() {
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
          coinResponse.error?.message || "Failed to load coin leaderboard",
        );
        return;
      }

      if (!expResponse.success) {
        setError(
          expResponse.error?.message || "Failed to load exp leaderboard",
        );
        return;
      }

      if (!collectorResponse.success) {
        setError(
          collectorResponse.error?.message ||
            "Failed to load collector leaderboard",
        );
        return;
      }

      setCoinLeaderboard(coinResponse.data?.leaderboard || []);
      setExpLeaderboard(expResponse.data?.leaderboard || []);
      setCollectorLeaderboard(collectorResponse.data?.leaderboard || []);
    } catch (err) {
      console.error("Error loading leaderboard:", err);
      setError("Failed to load leaderboard");
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
          <p className="font-medium text-gray-600">Loading leaderboard...</p>
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
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f5f7ff] pb-24 md:bg-transparent md:px-6 md:py-10 md:pb-12">
      <section className="sticky top-0 z-10 flex items-center justify-between bg-white px-6 py-5 shadow-sm md:static md:mb-8 md:rounded-3xl">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-100 ring-4 ring-slate-200">
            <Trophy className="h-7 w-7 text-[#155ca5]" />
          </div>

          <h1 className="truncate text-3xl font-black tracking-tight text-[#155ca5] md:text-5xl">
            Leaderboard
          </h1>
        </div>

        <Settings className="h-8 w-8 shrink-0 text-slate-500 md:hidden" />
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-8 px-5 py-10 md:px-0 md:py-0">
        <p className="text-center text-2xl font-semibold text-slate-700 md:text-left md:text-xl">
          Top 10 Coins, EXP and Collection.
        </p>

        <div className="grid grid-cols-3 rounded-[2rem] bg-white/70 p-2 shadow-sm md:inline-grid md:w-auto">
          <TabButton
            active={activeTab === "coin"}
            onClick={() => setActiveTab("coin")}
            icon={<Coins className="h-5 w-5" />}
          >
            Coin
          </TabButton>

          <TabButton
            active={activeTab === "exp"}
            onClick={() => setActiveTab("exp")}
            icon={<Sparkles className="h-5 w-5" />}
          >
            EXP
          </TabButton>

          <TabButton
            active={activeTab === "collection"}
            onClick={() => setActiveTab("collection")}
            icon={<Palette className="h-5 w-5" />}
          >
            Collection
          </TabButton>
        </div>

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
              <p className="text-lg text-gray-500">No leaderboard data yet</p>
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
          YOU
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
                  value={`${entry.score}%`}
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
                <Metric value={`${entry.categoryCount} cat`} />
                <Metric value={`${entry.avatarCount} ava`} />
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
  return (
    <DesktopTable headers={["Rank", "User", "Coin", "Score", "Streak"]}>
      {data.map((entry) => (
        <tr
          key={entry.userId}
          className={entry.currentUser ? "bg-[#155ca5]/10" : "hover:bg-gray-50"}
        >
          <Td>#{entry.rank}</Td>
          <UserTd entry={entry} />
          <Td className="text-[#155ca5]">{entry.coin.toLocaleString()}</Td>
          <Td>{entry.score}%</Td>
          <Td>
            <FlameMetric value={entry.streak} />
          </Td>
        </tr>
      ))}
    </DesktopTable>
  );
}

function DesktopExpTable({ data }: { data: ExpLeaderboardEntryResponse[] }) {
  return (
    <DesktopTable headers={["Rank", "User", "EXP", "Streak"]}>
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
  return (
    <DesktopTable
      headers={["Rank", "User", "Items", "Categories", "Avatar", "Background"]}
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
              YOU
            </span>
          )}
        </span>
      </div>
    </td>
  );
}
