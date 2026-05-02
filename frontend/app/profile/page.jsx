'use client';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
        <div className="glass p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user?.name || 'Loading...'}</h2>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              <span className="badge badge-purple mt-2">{user?.role}</span>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6">
            <p className="text-slate-500 text-sm">
              More profile settings will be available in future updates. For now, your account is fully set up for job matching.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
