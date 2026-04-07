import { useState, useEffect } from 'react';
import { TrendingUp, Users, BookOpen, Trophy, Download, Loader2 } from 'lucide-react';
import { adminApi } from '@/api';

export function Reports() {
  const [reports, setReports] = useState({
    userGrowth: [] as any[],
    engagement: {} as any,
    performance: {} as any,
    revenue: {} as any,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadReports();
  }, [selectedPeriod]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const [activityResponse, statsResponse] = await Promise.all([
        adminApi.getUserActivity({ days: selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365 }),
        adminApi.getAdminStats(),
      ]);

      if (activityResponse.success) {
        setReports((prev) => ({
          ...prev,
          userGrowth: activityResponse.data,
          engagement: statsResponse.data,
        }));
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-bold">{error}</p>
        <button
          onClick={loadReports}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Analytics & Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Track platform performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-slate-200 rounded-md font-medium"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <button className="px-6 py-2 bg-[#155ca5] text-white rounded-md font-bold hover:bg-[#005095] transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#155ca5]/10 rounded-lg">
              <Users className="w-6 h-6 text-[#155ca5]" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Active Users</p>
              <p className="text-2xl font-black">{reports.engagement?.activeUsers || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#27ae60]">
            <TrendingUp className="w-3 h-3" />
            <span>+12.5% vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#27ae60]/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-[#27ae60]" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Lessons Completed</p>
              <p className="text-2xl font-black">2,450</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#27ae60]">
            <TrendingUp className="w-3 h-3" />
            <span>+8.3% vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#f39c12]/10 rounded-lg">
              <Trophy className="w-6 h-6 text-[#f39c12]" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Tests Taken</p>
              <p className="text-2xl font-black">1,823</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#27ae60]">
            <TrendingUp className="w-3 h-3" />
            <span>+15.7% vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Avg Score</p>
              <p className="text-2xl font-black">84.2%</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#27ae60]">
            <TrendingUp className="w-3 h-3" />
            <span>+2.1% vs last period</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="font-bold text-lg mb-4">User Activity</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {reports.userGrowth.map((day, idx) => {
              const max = Math.max(...reports.userGrowth.map((d: any) => d.activeUsers));
              const height = (day.activeUsers / max) * 100;
              return (
                <div key={idx} className="flex-1 relative group">
                  <div
                    className="bg-[#155ca5]/20 hover:bg-[#155ca5]/40 transition-all rounded-t"
                    style={{ height: `${height}%` }}
                  >
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-bold bg-slate-900 text-white px-2 py-1 rounded whitespace-nowrap">
                      {day.activeUsers}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="font-bold text-lg mb-4">Performance Distribution</h2>
          <div className="space-y-4">
            {[
              { label: 'Excellent (90-100%)', value: 35, color: 'bg-[#27ae60]' },
              { label: 'Good (80-89%)', value: 45, color: 'bg-[#155ca5]' },
              { label: 'Average (70-79%)', value: 15, color: 'bg-[#f39c12]' },
              { label: 'Below Average (<70%)', value: 5, color: 'bg-[#e74c3c]' },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.label}</span>
                  <span className="font-bold">{item.value}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
