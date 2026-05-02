'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import Link from 'next/link';
import { Search, MapPin, DollarSign, Clock, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';



export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '9' });
      if (search) params.set('search', search);
      if (location) params.set('location', location);

      const { data } = await api.get(`/jobs?${params}`);
      setJobs(data.data.jobs);
      setTotalPages(data.data.pagination.totalPages || 1);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = (n) => `$${(n / 1000).toFixed(0)}k`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return `Up to ${fmt(max)}`;
  };

  const timeAgo = (date) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-28 pb-16">
        <div className="mb-10">
          <h1 className="text-sm font-bold mb-2">Browse Jobs</h1>
          <p className="text-slate-500">Find opportunities that match your skills</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="glass p-4 flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          <div className="flex-1">
            <input
              id="job-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Job title, skill, or keyword…"
              className="input-field"
            />
          </div>
          <div className="sm:w-56">
            <input
              id="job-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location…"
              className="input-field"
            />
          </div>
          <button type="submit" className="btn-primary px-8 py-3 whitespace-nowrap">
            Search
          </button>
        </form>

        {/* Job Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="glass p-5 animate-pulse">
                <div className="h-5 bg-slate-100 rounded mb-3 w-3/4" />
                <div className="h-4 bg-slate-100 rounded mb-2 w-1/2" />
                <div className="h-3 bg-slate-100 rounded mb-4 w-full" />
                <div className="flex gap-2">
                  <div className="h-6 bg-slate-100 rounded-full w-16" />
                  <div className="h-6 bg-slate-100 rounded-full w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-24">
            <Briefcase size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">No jobs found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="glass p-5 hover:border-violet-500/40 hover:-translate-y-0.5 transition-all group block fade-up"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-sm">
                    🏢
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={11} /> {timeAgo(job.createdAt)}
                  </span>
                </div>

                <h2 className="font-semibold text-sm mb-1 group-hover:text-violet-800 transition-colors line-clamp-1">
                  {job.title}
                </h2>
                <p className="text-sm text-slate-500 mb-1">{job.employer.name}</p>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                  {formatSalary(job.salaryMin, job.salaryMax) && (
                    <span className="flex items-center gap-1">
                      <DollarSign size={11} /> {formatSalary(job.salaryMin, job.salaryMax)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 4).map((s) => (
                    <span key={s} className="badge badge-purple text-[11px]">{s}</span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className="badge badge-purple text-[11px]">+{job.skills.length - 4}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-violet-200 disabled:opacity-40 hover:border-violet-500/40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-violet-200 disabled:opacity-40 hover:border-violet-500/40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
