'use client';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Briefcase, LogOut, User, ChevronDown } from 'lucide-react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, isAuthenticated, logout, hydrate } = useAuthStore();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      return;
    }

    // 1. Initial fetch for unread count
    import('@/lib/api').then(({ default: api }) => {
      api.get('/notifications').then(({ data }) => {
        const unreadList = data.data.filter((n) => !n.isRead);
        setUnread(unreadList.length);
      }).catch(err => console.error('Failed to fetch notifications:', err));
    });

    // 2. Setup real-time listeners
    connectSocket();
    const socket = getSocket();

    const handleNewNotification = (data) => {
      setUnread((n) => n + 1);
      toast(data.message, { 
        icon: '🔔',
        duration: 5000,
        style: {
          borderRadius: '12px',
          background: '#fff',
          color: '#1e293b',
          border: '1px solid rgba(139, 92, 246, 0.2)',
        },
      });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
      disconnectSocket();
    };
  }, [isAuthenticated]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(0,0,0,0.05)] bg-[rgba(255,255,255,0.8)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Briefcase size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">
            Sync<span className="text-violet-600">Up</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-5">
          <Link href="/jobs" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Browse Jobs
          </Link>
          {isAuthenticated && user?.role === 'EMPLOYER' && (
            <Link href="/jobs/create" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
              Post a Job
            </Link>
          )}
          {isAuthenticated && user?.role === 'JOB_SEEKER' && (
            <Link href="/dashboard/applications" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
              My Applications
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Notification bell */}
              <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell size={18} className="text-slate-500" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-violet-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-violet-200 hover:border-violet-500/40 transition-colors text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-slate-700 hidden sm:block max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass rounded-xl p-1 shadow-xl shadow-black/40">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <User size={14} /> Profile
                    </Link>
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 px-3 py-1.5 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary text-sm py-2 px-4">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
