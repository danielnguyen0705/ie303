import { useState, useEffect } from 'react';
import { Target, Trophy, Star, Gift, Lock, CheckCircle, Loader2, Zap, Coins } from 'lucide-react';
import { getAllQuests, claimQuestReward, getAllAchievements } from '@/api';
import type { Quest, Achievement } from '@/data/mockData';

export function Quests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly' | 'achievements'>('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingQuest, setClaimingQuest] = useState<string | null>(null);

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

      if (questsResponse.success) {
        setQuests(questsResponse.data);
      }

      if (achievementsResponse.success) {
        setAchievements(achievementsResponse.data);
      }
    } catch (err) {
      console.error('Error loading quests:', err);
      setError('Failed to load quests and achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (questId: string) => {
    try {
      setClaimingQuest(questId);
      const response = await claimQuestReward({ questId });

      if (response.success) {
        // Update quest status
        setQuests(prev =>
          prev.map(q =>
            q.id === questId ? { ...q, status: 'claimed' as const } : q
          )
        );

        // Show success notification (could be a toast)
        alert(`🎉 Claimed ${response.data.rewards.xp} XP and ${response.data.rewards.coins} coins!`);
      }
    } catch (err) {
      console.error('Error claiming reward:', err);
      alert('Failed to claim reward. Please try again.');
    } finally {
      setClaimingQuest(null);
    }
  };

  const filteredQuests = quests.filter(q => {
    if (selectedTab === 'daily') return q.type === 'daily';
    if (selectedTab === 'weekly') return q.type === 'weekly';
    return false;
  });

  const getProgressColor = (progress: number, target: number) => {
    const percentage = (progress / target) * 100;
    if (percentage >= 100) return 'bg-[#27ae60]';
    if (percentage >= 50) return 'bg-[#f39c12]';
    return 'bg-[#155ca5]';
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading quests...</p>
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
            onClick={loadQuestsAndAchievements}
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
            Quests & Achievements
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Complete daily challenges and unlock special achievements!
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
          <button
            onClick={() => setSelectedTab('daily')}
            className={`px-6 py-3 rounded-md font-bold transition-all flex items-center gap-2 ${
              selectedTab === 'daily'
                ? 'bg-[#155ca5] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Target className="w-5 h-5" />
            Daily Quests
          </button>
          <button
            onClick={() => setSelectedTab('weekly')}
            className={`px-6 py-3 rounded-md font-bold transition-all flex items-center gap-2 ${
              selectedTab === 'weekly'
                ? 'bg-[#155ca5] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Star className="w-5 h-5" />
            Weekly Quests
          </button>
          <button
            onClick={() => setSelectedTab('achievements')}
            className={`px-6 py-3 rounded-md font-bold transition-all flex items-center gap-2 ${
              selectedTab === 'achievements'
                ? 'bg-[#155ca5] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Trophy className="w-5 h-5" />
            Achievements
          </button>
        </div>
      </section>

      {/* Quests */}
      {selectedTab !== 'achievements' && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredQuests.map((quest) => {
              const isCompleted = quest.status === 'completed';
              const isClaimed = quest.status === 'claimed';
              const isClaiming = claimingQuest === quest.id;

              return (
                <div
                  key={quest.id}
                  className={`bg-white p-6 rounded-lg shadow-sm border-2 transition-all ${
                    isCompleted && !isClaimed
                      ? 'border-[#27ae60] shadow-lg'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isClaimed ? 'bg-gray-200' : 'bg-[#155ca5]/10'
                      }`}>
                        {isClaimed ? (
                          <CheckCircle className="w-6 h-6 text-gray-400" />
                        ) : (
                          <Target className={`w-6 h-6 ${isCompleted ? 'text-[#27ae60]' : 'text-[#155ca5]'}`} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{quest.title}</h3>
                        <p className="text-sm text-gray-600">{quest.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-bold">
                        {quest.progress}/{quest.target}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(quest.progress, quest.target)}`}
                        style={{ width: `${Math.min((quest.progress / quest.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Rewards & Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm font-bold">
                      <div className="flex items-center gap-1 text-[#155ca5]">
                        <Zap className="w-4 h-4" fill="#155ca5" />
                        <span>+{quest.xpReward} XP</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#f1c40f]">
                        <Coins className="w-4 h-4" fill="#f1c40f" />
                        <span>+{quest.coinsReward}</span>
                      </div>
                    </div>

                    {isClaimed ? (
                      <span className="text-sm text-gray-500 font-bold">Claimed ✓</span>
                    ) : isCompleted ? (
                      <button
                        onClick={() => handleClaimReward(quest.id)}
                        disabled={isClaiming}
                        className="px-4 py-2 bg-[#27ae60] text-white rounded-md font-bold hover:bg-[#229954] transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isClaiming ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Claiming...
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4" />
                            Claim Reward
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500 font-bold">
                        {quest.target - quest.progress} more to go
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredQuests.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No {selectedTab} quests available</p>
            </div>
          )}
        </section>
      )}

      {/* Achievements */}
      {selectedTab === 'achievements' && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => {
              const isUnlocked = !achievement.isLocked;
              const progressPercentage = achievement.requirement
                ? ((achievement.progress || 0) / achievement.requirement) * 100
                : 0;

              return (
                <div
                  key={achievement.id}
                  className={`bg-white p-6 rounded-lg shadow-sm border-2 transition-all ${
                    isUnlocked
                      ? 'border-[#ffd700]'
                      : 'border-transparent opacity-75'
                  }`}
                >
                  <div className="text-center mb-4">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 ${
                      isUnlocked ? 'bg-[#ffd700]/20' : 'bg-gray-200'
                    }`}>
                      {isUnlocked ? (
                        <Trophy className="w-10 h-10 text-[#ffd700]" />
                      ) : (
                        <Lock className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-1">{achievement.title}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>

                  {!isUnlocked && achievement.requirement && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Progress</span>
                        <span className="font-bold">
                          {achievement.progress || 0}/{achievement.requirement}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#155ca5] rounded-full transition-all"
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isUnlocked && achievement.unlockedAt && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center">
                        Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {achievements.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No achievements available</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}