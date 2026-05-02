'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Bell, Check, CheckCheck } from 'lucide-react';



export default function NotificationsPage() {
  const { isAuthenticated, hydrate } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    api.get('/notifications')
      .then(({ data }) => setNotifications(data.data))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All marked as read');
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-sm font-bold">Notifications</h1>
            {unread > 0 && <p className="text-slate-500 text-sm mt-1">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 transition-colors"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="glass p-4 animate-pulse h-14" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-24 glass rounded-2xl">
            <Bell size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`glass p-4 flex items-start gap-4 transition-all ${
                  !n.isRead ? 'border-violet-300 bg-violet-50' : 'opacity-70'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.isRead ? 'bg-violet-500' : 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-violet-600 transition-colors"
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
