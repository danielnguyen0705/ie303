import { useState, useEffect } from "react";
import { Coins, Flame, Loader2, Palette, Users } from "lucide-react";
import { getCoinLeaderboard, getCollectorLeaderboard } from "@/api";
import type {
  CoinLeaderboardEntryResponse,
  CollectorLeaderboardEntryResponse,
} from "@/api/types";

export function Leaderboard() {
  const [coinLeaderboard, setCoinLeaderboard] = useState<
    CoinLeaderboardEntryResponse[]
  >([]);
  const [collectorLeaderboard, setCollectorLeaderboard] = useState<
    CollectorLeaderboardEntryResponse[]
  >([]);
  const [activeTab, setActiveTab] = useState<"coin" | "collection">("coin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [coinResponse, collectorResponse] = await Promise.all([
        getCoinLeaderboard(10),
        getCollectorLeaderboard(10),
      ]);

      if (!coinResponse.success) {
        setError(
          coinResponse.error?.message || "Failed to load coin leaderboard",
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
      setCollectorLeaderboard(collectorResponse.data?.leaderboard || []);
    } catch (err) {
      console.error("Error loading leaderboard:", err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading leaderboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-bold">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 pb-24 md:pb-12">
      <section className="space-y-6">
        <div>
          <h1 className="text-5xl font-black text-[#155ca5] tracking-tight mb-2">
            Leaderboard
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Top 10 Coins and Collection.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-2 inline-flex gap-2">
          <button
            onClick={() => setActiveTab("coin")}
            className={`px-4 py-2 rounded-md font-bold text-sm transition-colors inline-flex items-center gap-2 ${
              activeTab === "coin"
                ? "bg-[#155ca5] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Coins className="w-4 h-4" />
            Coin
          </button>
          <button
            onClick={() => setActiveTab("collection")}
            className={`px-4 py-2 rounded-md font-bold text-sm transition-colors inline-flex items-center gap-2 ${
              activeTab === "collection"
                ? "bg-[#155ca5] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Palette className="w-4 h-4" />
            Collection
          </button>
        </div>

        {activeTab === "coin" ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#f39c12]" />
              <h2 className="text-lg font-black text-[#155ca5]">
                Coin Leaderboard
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                      Coin
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                      Streak
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coinLeaderboard.map((entry) => (
                    <tr
                      key={`coin-${entry.userId}`}
                      className={
                        entry.currentUser
                          ? "bg-[#155ca5]/10"
                          : "hover:bg-gray-50"
                      }
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-black">
                        #{entry.rank}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={entry.avatar}
                            alt={entry.username}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-sm font-bold">
                            {entry.username}
                            {entry.currentUser && (
                              <span className="ml-2 text-[10px] bg-[#155ca5] text-white px-2 py-0.5 rounded-full">
                                YOU
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-[#f39c12]">
                        {entry.coin.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-[#155ca5]">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold">
                        <span className="inline-flex items-center gap-1">
                          <Flame
                            className="w-4 h-4 text-[#f39c12]"
                            fill="#f39c12"
                          />
                          {entry.streak}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#8e44ad]" />
              <h2 className="text-lg font-black text-[#155ca5]">
                Collection Leaderboard
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                      Collector
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                      Items
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                      Categories
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                      Avatar / Bg
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {collectorLeaderboard.map((entry) => (
                    <tr
                      key={`collector-${entry.userId}`}
                      className={
                        entry.currentUser
                          ? "bg-[#155ca5]/10"
                          : "hover:bg-gray-50"
                      }
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-black">
                        #{entry.rank}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={entry.avatar}
                            alt={entry.username}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-sm font-bold">
                            {entry.username}
                            {entry.currentUser && (
                              <span className="ml-2 text-[10px] bg-[#155ca5] text-white px-2 py-0.5 rounded-full">
                                YOU
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-[#155ca5]">
                        {entry.collectibleCount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold">
                        {entry.categoryCount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-700">
                        {entry.avatarCount} / {entry.backgroundCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {coinLeaderboard.length === 0 && collectorLeaderboard.length === 0 && (
        <section className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No leaderboard data yet</p>
        </section>
      )}
    </main>
  );
}
