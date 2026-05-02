import { useState, useEffect } from 'react';
import { Bell, Send, Users, Loader2, CheckCircle } from 'lucide-react';
import { adminApi } from '@/api';

export function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetUsers: 'all' as 'all' | 'vip' | 'active',
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.getNotificationHistory({ page: 1, pageSize: 20 });

      if (response.success) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSending(true);
      const response = await adminApi.sendNotification({
        title: formData.title,
        message: formData.message,
        targetUsers: formData.targetUsers,
      });

      if (response.success) {
        alert('Notification sent successfully!');
        setFormData({ title: '', message: '', targetUsers: 'all' });
        loadNotifications();
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-bold">{error}</p>
        <button
          onClick={loadNotifications}
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
        <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">Send notifications to users</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Send Notification Form */}
        <div className="col-span-5 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-[#155ca5]" />
            Send Notification
          </h2>
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]"
                placeholder="Notification title..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]"
                placeholder="Notification message..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Target Users</label>
              <select
                value={formData.targetUsers}
                onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]"
              >
                <option value="all">All Users</option>
                <option value="vip">VIP Users Only</option>
                <option value="active">Active Users Only</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full px-6 py-3 bg-[#155ca5] text-white rounded-md font-bold hover:bg-[#005095] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Notification
                </>
              )}
            </button>
          </form>
        </div>

        {/* Notification History */}
        <div className="col-span-7 bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-lg">Notification History</h2>
          </div>
          <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#155ca5]/10 rounded-lg">
                      <Bell className="w-5 h-5 text-[#155ca5]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold">{notification.title}</h3>
                        <span className="text-xs text-slate-500">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Target: {notification.targetUsers}
                        </span>
                        {notification.sentCount && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-[#27ae60]" />
                            Sent to {notification.sentCount} users
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No notifications sent yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
