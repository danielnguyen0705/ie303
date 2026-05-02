import { useState, useEffect } from 'react';
import { Crown, TrendingUp, DollarSign, Users, Loader2, CheckCircle } from 'lucide-react';
import { adminApi } from '@/api';

export function VIPManagement() {
  const [vipStats, setVipStats] = useState({
    totalVIP: 0,
    premiumUsers: 0,
    eliteUsers: 0,
    revenue: 0,
    conversionRate: 0,
    growthRate: 0,
  });
  const [vipUsers, setVipUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVIPData();
  }, []);

  const loadVIPData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, usersResponse] = await Promise.all([
        adminApi.getVIPStats(),
        adminApi.getAllUsers({ vipStatus: 'premium', page: 1, pageSize: 10 }),
      ]);

      if (statsResponse.success) {
        setVipStats(statsResponse.data);
      }

      if (usersResponse.success) {
        setVipUsers(usersResponse.data.data);
      }
    } catch (err) {
      console.error('Error loading VIP data:', err);
      setError('Failed to load VIP data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading VIP data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-bold">{error}</p>
        <button
          onClick={loadVIPData}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">VIP Management</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor and manage VIP subscriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Total VIP</p>
              <p className="text-2xl font-black">{vipStats.totalVIP}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Premium</p>
              <p className="text-2xl font-black">{vipStats.premiumUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#27ae60]/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-[#27ae60]" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Revenue</p>
              <p className="text-2xl font-black">${vipStats.revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#155ca5]/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-[#155ca5]" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Growth</p>
              <p className="text-2xl font-black">+{vipStats.growthRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* VIP Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-lg">Premium Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-600">User</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-600">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-600">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-600">Level</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {vipUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <div className="font-bold text-sm">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-bold capitalize">
                      {user.vipStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(user.joinedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">Level {user.level}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm text-[#155ca5] font-bold hover:underline">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
