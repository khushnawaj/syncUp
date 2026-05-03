'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { User, FileText, TrendingUp, ArrowLeft, ExternalLink, Mail } from 'lucide-react';
import Link from 'next/link';

export default function JobApplicationsPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    api.get(`/applications/jobs/${id}`)
      .then(({ data }) => setApps(data.data))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, router]);

  const scoreColor = (score) => {
    if (!score) return 'text-slate-400';
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const scoreBg = (score) => {
    if (!score) return 'bg-slate-100';
    if (score >= 75) return 'bg-emerald-50';
    if (score >= 50) return 'bg-amber-50';
    return 'bg-rose-50';
  };

  if (loading) {
    return (
      <div className="gradient-bg min-h-screen">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 pt-28">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/4" />
            <div className="h-64 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-28 pb-16">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Jobs
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Applicant Ranking</h1>
            <p className="text-slate-500 text-sm">AI-driven candidate matching for this position</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-sm font-semibold text-slate-900">{apps.length}</span>
            <span className="text-sm text-slate-500 ml-1">Total Applicants</span>
          </div>
        </div>

        {apps.length === 0 ? (
          <div className="glass p-12 text-center">
            <User size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No applications received yet for this position.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => (
              <div key={app.id} className="glass p-6 hover:shadow-xl transition-all border-l-4" style={{ borderLeftColor: app.matchScore >= 75 ? '#10b981' : app.matchScore >= 50 ? '#f59e0b' : '#f43f5e' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Candidate Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <User size={20} className="text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{app.applicant.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail size={12} /> {app.applicant.email}
                        </span>
                        <span className="text-xs text-slate-400">
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${scoreBg(app.matchScore)} border border-white/50 shrink-0`}>
                    <TrendingUp size={20} className={scoreColor(app.matchScore)} />
                    <div className="text-center">
                      <div className={`text-xl font-black ${scoreColor(app.matchScore)}`}>
                        {app.matchScore || 0}%
                      </div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">AI Match</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {app.resumeUrl && (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                      >
                        <FileText size={14} /> Resume <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Cover Letter Snapshot */}
                {app.coverLetter && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cover Letter Snapshot</h4>
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      &ldquo;{app.coverLetter.length > 200 ? app.coverLetter.substring(0, 200) + '...' : app.coverLetter}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
