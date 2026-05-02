'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Briefcase, MapPin, Clock, TrendingUp } from 'lucide-react';



const STATUS_BADGE = {
  PENDING: 'badge-amber',
  REVIEWED: 'badge-purple',
  SHORTLISTED: 'badge-green',
  REJECTED: 'badge-red',
  HIRED: 'badge-green',
};

export default function MyApplicationsPage() {
  const { isAuthenticated, hydrate } = useAuthStore();
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    api.get('/applications/my')
      .then(({ data }) => setApps(data.data))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const scoreColor = (score) => {
    if (!score) return 'text-slate-500';
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-sm font-bold mb-1">My Applications</h1>
          <p className="text-slate-500 text-sm">{apps.length} application{apps.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass p-5 animate-pulse">
                <div className="h-5 bg-slate-100 rounded w-1/2 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-24 glass rounded-2xl">
            <Briefcase size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">You haven&apos;t applied to any jobs yet.</p>
            <Link href="/jobs" className="btn-primary inline-flex">Browse Jobs</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => (
              <div key={app.id} className="glass p-5 fade-up hover:border-violet-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="font-semibold hover:text-violet-800 transition-colors block truncate"
                    >
                      {app.job.title}
                    </Link>
                    <p className="text-sm text-slate-500 mt-0.5">{app.job.employer.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {app.job.location}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {app.matchScore !== undefined && app.matchScore !== null ? (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={14} className={scoreColor(app.matchScore)} />
                        <span className={`text-sm font-bold ${scoreColor(app.matchScore)}`}>
                          {app.matchScore}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 italic">Scoring…</span>
                    )}
                    <span className={`badge ${STATUS_BADGE[app.status] || 'badge-purple'} capitalize`}>
                      {app.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
