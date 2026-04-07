import { useState, useEffect } from 'react';
import { Users, Crown, MessageSquare, Flame, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { adminApi } from '@/api';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    vipUsers: 0,
    totalQuestions: 0,
    activeStreaks: 0,
    vipPercentage: 0,
  });
  const [activityData, setActivityData] = useState<number[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, activityResponse, usersResponse] = await Promise.all([
        adminApi.getAdminStats(),
        adminApi.getUserActivity({ days: 7 }),
        adminApi.getAllUsers({ page: 1, pageSize: 5, sortBy: 'joinedDate', sortOrder: 'desc' }),
      ]);

      if (statsResponse.success) {
        // Map API response to component state structure
        const apiStats = statsResponse.data;
        setStats({
          totalUsers: apiStats.totalUsers || 0,
          activeUsers: apiStats.activeUsers || 0,
          vipUsers: apiStats.vipSubscriptions?.total || 0,
          totalQuestions: apiStats.totalQuestions || 0,
          activeStreaks: 0, // Not in API, keep as 0
          vipPercentage: apiStats.totalUsers > 0 
            ? ((apiStats.vipSubscriptions?.total || 0) / apiStats.totalUsers) * 100 
            : 0,
        });
      }

      if (activityResponse.success) {
        // Extract daily active users count
        const dailyCounts = activityResponse.data.map(d => d.activeUsers);
        setActivityData(dailyCounts);
      }

      if (usersResponse.success) {
        setRecentUsers(usersResponse.data.data);
      }
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-bold">{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate max for chart scaling
  const maxActivity = Math.max(...activityData, 100);
  const chartData = activityData.length > 0 
    ? activityData 
    : [60, 75, 65, 85, 95, 40, 35];

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#155ca5]/5 text-[#155ca5] rounded-md">
              <Users size={20} />
            </div>
            <span className="text-[11px] font-bold text-[#27ae60] uppercase tracking-tighter bg-[#27ae60]/10 px-2 py-0.5 rounded">
              +{((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% ACTIVE
            </span>
          </div>
          <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Tổng học sinh</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.totalUsers.toLocaleString()}
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#155ca5]/5 text-[#155ca5] rounded-md">
              <Crown size={20} />
            </div>
            <span className="text-[11px] font-bold text-[#155ca5] uppercase tracking-tighter bg-[#155ca5]/10 px-2 py-0.5 rounded">
              {stats.vipUsers} VIP
            </span>
          </div>
          <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Tài khoản VIP %</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.vipPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#b02d21]/5 text-[#b02d21] rounded-md">
              <MessageSquare size={20} />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded">
              ACTIVE
            </span>
          </div>
          <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Tổng câu hỏi</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.totalQuestions.toLocaleString()}
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#f39c12]/5 text-[#f39c12] rounded-md">
              <Flame size={20} />
            </div>
            <span className="text-[11px] font-bold text-[#f39c12] uppercase tracking-tighter bg-[#f39c12]/10 px-2 py-0.5 rounded">
              TRENDING UP
            </span>
          </div>
          <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Streak đang hoạt động</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.activeStreaks.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-6">
        {/* Active Students Chart */}
        <div className="col-span-8 bg-white p-6 rounded-lg shadow-sm border-b-2 border-[#155ca5]/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Số học sinh hoạt động (7 ngày)</h2>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Last 7 days</span>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 relative pt-10">
            <div className="absolute inset-x-0 top-1/4 border-t border-slate-100"></div>
            <div className="absolute inset-x-0 top-2/4 border-t border-slate-100"></div>
            <div className="absolute inset-x-0 top-3/4 border-t border-slate-100"></div>
            {chartData.map((value, idx) => {
              const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
              const isWeekend = idx >= 5;
              const height = (value / maxActivity) * 100;
              return (
                <div key={idx} className="relative group flex-1">
                  <div 
                    className={`${isWeekend ? 'bg-[#b02d21]/40 hover:bg-[#b02d21]/60' : 'bg-[#155ca5]/20 hover:bg-[#155ca5]/40'} transition-all rounded-t w-full relative`}
                    style={{ height: `${height}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-bold bg-slate-900 text-white px-2 py-1 rounded whitespace-nowrap">
                      {value.toLocaleString()}
                    </span>
                  </div>
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400">{days[idx]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Users */}
        <div className="col-span-4 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-6">Người dùng mới</h2>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{user.name}</h4>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                {user.vipStatus !== 'free' && (
                  <Crown className="w-4 h-4 text-[#f1c40f]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#27ae60]/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-[#27ae60]" />
            </div>
            <div>
              <h3 className="text-xs text-slate-500 font-bold uppercase">Active Users</h3>
              <p className="text-2xl font-black">{stats.activeUsers.toLocaleString()}</p>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#27ae60] rounded-full"
              style={{ width: `${(stats.activeUsers / stats.totalUsers) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#155ca5]/10 rounded-lg">
              <Crown className="w-6 h-6 text-[#155ca5]" />
            </div>
            <div>
              <h3 className="text-xs text-slate-500 font-bold uppercase">VIP Members</h3>
              <p className="text-2xl font-black">{stats.vipUsers.toLocaleString()}</p>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#155ca5] rounded-full"
              style={{ width: `${stats.vipPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#f39c12]/10 rounded-lg">
              <Flame className="w-6 h-6 text-[#f39c12]" />
            </div>
            <div>
              <h3 className="text-xs text-slate-500 font-bold uppercase">Active Streaks</h3>
              <p className="text-2xl font-black">{stats.activeStreaks.toLocaleString()}</p>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#f39c12] rounded-full"
              style={{ width: '75%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}