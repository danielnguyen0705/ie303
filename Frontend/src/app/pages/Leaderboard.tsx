import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Users, Flame, Target, Loader2 } from 'lucide-react';
import { getLeaderboard, getUserRank, getLeagueInfo } from '@/api';
import type { LeaderboardEntry } from '@/data/mockData';

export function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<{
    rank: number;
    entry: LeaderboardEntry;
    percentile: number;
  } | null>(null);
  const [leagueInfo, setLeagueInfo] = useState<{
    currentLeague: string;
    rankInLeague: number;
    totalInLeague: number;
    xpToNextLeague: number;
    promotionZone: boolean;
  } | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedLeague]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const filter = selectedLeague === 'all' ? undefined : { league: selectedLeague as any };

      const [leaderboardResponse, userRankResponse, leagueInfoResponse] = await Promise.all([
        getLeaderboard(filter, 1, 50),
        getUserRank(),
        getLeagueInfo(),
      ]);

      if (leaderboardResponse.success) {
        setLeaderboardData(leaderboardResponse.data.data);
      }

      if (userRankResponse.success) {
        setUserRank(userRankResponse.data);
      }

      if (leagueInfoResponse.success) {
        setLeagueInfo(leagueInfoResponse.data);
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getLeagueBadge = (league: string) => {
    const badges = {
      bronze: { color: 'bg-[#cd7f32]', icon: Medal },
      silver: { color: 'bg-[#c0c0c0]', icon: Medal },
      gold: { color: 'bg-[#ffd700]', icon: Crown },
      platinum: { color: 'bg-[#e5e4e2]', icon: Crown },
      diamond: { color: 'bg-[#b9f2ff]', icon: Trophy },
    };
    return badges[league as keyof typeof badges] || badges.bronze;
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-[#ffd700]" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-[#c0c0c0]" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-[#cd7f32]" />;
    return null;
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
      {/* Header */}
      <section className="space-y-6">
        <div>
          <h1 className="text-5xl font-black text-[#155ca5] tracking-tight mb-2">
            Leaderboard
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Compete with learners worldwide and climb the ranks!
          </p>
        </div>

        {/* User Stats */}
        {userRank && leagueInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <Trophy className="w-10 h-10 text-[#155ca5]" />
                <div>
                  <div className="text-3xl font-black text-[#155ca5]">#{userRank.rank}</div>
                  <div className="text-sm font-bold text-gray-600">Your Global Rank</div>
                  <div className="text-xs text-gray-500">
                    Top {userRank.percentile.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                {(() => {
                  const badge = getLeagueBadge(leagueInfo.currentLeague);
                  const Icon = badge.icon;
                  return <Icon className={`w-10 h-10 text-white ${badge.color} p-2 rounded-lg`} />;
                })()}
                <div>
                  <div className="text-2xl font-black capitalize">{leagueInfo.currentLeague}</div>
                  <div className="text-sm font-bold text-gray-600">Current League</div>
                  <div className="text-xs text-gray-500">
                    #{leagueInfo.rankInLeague} of {leagueInfo.totalInLeague}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <Target className="w-10 h-10 text-[#27ae60]" />
                <div>
                  <div className="text-2xl font-black text-[#27ae60]">
                    {leagueInfo.xpToNextLeague.toLocaleString()} XP
                  </div>
                  <div className="text-sm font-bold text-gray-600">To Next League</div>
                  {leagueInfo.promotionZone && (
                    <div className="text-xs text-[#27ae60] font-bold">
                      🎉 Promotion Zone!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* League Filter */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
          <button
            onClick={() => setSelectedLeague('all')}
            className={`px-4 py-2 rounded-md font-bold transition-all ${
              selectedLeague === 'all'
                ? 'bg-[#155ca5] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            All Leagues
          </button>
          {['bronze', 'silver', 'gold', 'platinum', 'diamond'].map((league) => {
            const badge = getLeagueBadge(league);
            return (
              <button
                key={league}
                onClick={() => setSelectedLeague(league)}
                className={`px-4 py-2 rounded-md font-bold capitalize transition-all ${
                  selectedLeague === league
                    ? `${badge.color} text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {league}
              </button>
            );
          })}
        </div>
      </section>

      {/* Leaderboard Table */}
      <section className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                  Player
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                  League
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                  Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                  XP
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                  Streak
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                  Accuracy
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboardData.map((entry, index) => {
                const isCurrentUser = userRank?.entry.userId === entry.userId;
                const badge = getLeagueBadge(entry.league);

                return (
                  <tr
                    key={entry.userId}
                    className={`transition-colors ${
                      isCurrentUser
                        ? 'bg-[#155ca5]/10 hover:bg-[#155ca5]/20'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getMedalIcon(entry.rank)}
                        <span className={`text-lg font-black ${isCurrentUser ? 'text-[#155ca5]' : ''}`}>
                          #{entry.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={entry.avatar}
                          alt={entry.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <span className={`font-bold ${isCurrentUser ? 'text-[#155ca5]' : ''}`}>
                          {entry.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs bg-[#155ca5] text-white px-2 py-0.5 rounded-full">
                              YOU
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white capitalize ${badge.color}`}>
                        {entry.league}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold">Level {entry.level}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-[#155ca5]">
                        {entry.xp.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-[#f39c12]" fill="#f39c12" />
                        <span className="text-sm font-bold">{entry.streak}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-[#27ae60]">
                        {entry.accuracy}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {leaderboardData.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No players in this league yet</p>
          </div>
        )}
      </section>
    </main>
  );
}
