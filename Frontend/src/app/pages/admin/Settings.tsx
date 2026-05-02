import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Loader2, CheckCircle } from 'lucide-react';
import { adminApi } from '@/api';

export function Settings() {
  const [settings, setSettings] = useState({
    platformName: 'UIFIVE',
    enableRegistration: true,
    enableVIP: true,
    maintenanceMode: false,
    xpPerLesson: 50,
    coinsPerLesson: 10,
    streakBonus: 5,
    dailyQuestLimit: 3,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.getSystemSettings();

      if (response.success) {
        setSettings(response.data);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setSaveSuccess(false);
      const response = await adminApi.updateSystemSettings({ settings });

      if (response.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-bold">{error}</p>
        <button
          onClick={loadSettings}
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
        <h1 className="text-2xl font-black text-slate-900">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure platform settings</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#155ca5]" />
            General Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Platform Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md">
              <div>
                <h3 className="font-bold text-sm">Enable User Registration</h3>
                <p className="text-xs text-slate-500">Allow new users to register</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableRegistration}
                  onChange={(e) => setSettings({ ...settings, enableRegistration: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#155ca5]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#155ca5]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md">
              <div>
                <h3 className="font-bold text-sm">Enable VIP System</h3>
                <p className="text-xs text-slate-500">Allow VIP subscriptions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableVIP}
                  onChange={(e) => setSettings({ ...settings, enableVIP: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#155ca5]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#155ca5]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-md border border-amber-200">
              <div>
                <h3 className="font-bold text-sm text-amber-800">Maintenance Mode</h3>
                <p className="text-xs text-amber-600">Disable access for all users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Reward Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="font-bold text-lg mb-4">Reward Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">XP per Lesson</label>
              <input
                type="number"
                value={settings.xpPerLesson}
                onChange={(e) => setSettings({ ...settings, xpPerLesson: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Coins per Lesson</label>
              <input
                type="number"
                value={settings.coinsPerLesson}
                onChange={(e) => setSettings({ ...settings, coinsPerLesson: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Streak Bonus (XP)</label>
              <input
                type="number"
                value={settings.streakBonus}
                onChange={(e) => setSettings({ ...settings, streakBonus: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Daily Quest Limit</label>
              <input
                type="number"
                value={settings.dailyQuestLimit}
                onChange={(e) => setSettings({ ...settings, dailyQuestLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-[#27ae60]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-bold">Settings saved successfully!</span>
            </div>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-[#155ca5] text-white rounded-md font-bold hover:bg-[#005095] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
