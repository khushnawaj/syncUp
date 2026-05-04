'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { MapPin, DollarSign, Users, Clock, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';



export default function JobDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(({ data }) => setJob(data.data))
      .catch(() => toast.error('Job not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setApplying(true);
    try {
      let finalResumeUrl = '';

      if (resumeFile) {
        // 1. Get presigned URL from backend
        const { data: presignData } = await api.post('/upload/presign', { 
          fileType: resumeFile.type 
        });
        const { presignedUrl, publicUrl } = presignData.data;

        // 2. Upload directly to S3
        await fetch(presignedUrl, {
          method: 'PUT',
          body: resumeFile,
          headers: { 'Content-Type': resumeFile.type }
        });
        finalResumeUrl = publicUrl;
      }

      // 3. Submit application with the URL
      await api.post(`/applications/jobs/${id}/apply`, {
        coverLetter,
        resumeUrl: finalResumeUrl,
        resumeText: resumeText || ''
      });
      
      setApplied(true);
      setShowApply(false);
      toast.success('Application submitted! AI matching complete.');
    } catch (err) {
      console.error('Apply Error:', err);
      toast.error(err?.response?.data?.message || 'Application failed');
    } finally {
      setApplying(false);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not disclosed';
    const fmt = (n) => `$${(n / 1000).toFixed(0)}k`;
    if (min && max) return `${fmt(min)} – ${fmt(max)} / year`;
    return min ? `${fmt(min)}+ / year` : `Up to ${fmt(max)} / year`;
  };

  if (loading) {
    return (
      <div className="gradient-bg min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-28">
          <div className="glass p-5 animate-pulse space-y-4">
            <div className="h-8 bg-slate-100 rounded w-2/3" />
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-32 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const isOwnJob = user?.id === job.employer.id;
  const canApply = isAuthenticated && user?.role === 'JOB_SEEKER' && !isOwnJob && !applied;

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-16">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Jobs
        </Link>

        <div className="glass p-5 mb-5 fade-up">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">{job.title}</h1>
              <p className="text-slate-500 text-sm">{job.employer.name}</p>
            </div>
            <div className="shrink-0 flex gap-2">
              {isOwnJob && (
                <Link
                  href={`/dashboard/jobs/${job.id}/applications`}
                  className="px-4 py-2 rounded-xl bg-violet-100 text-violet-700 text-sm font-semibold hover:bg-violet-200 transition-all flex items-center gap-2"
                >
                  <Users size={16} /> View Applications
                </Link>
              )}
              {applied ? (
                <span className="badge badge-green px-3 py-1.5">✓ Applied</span>
              ) : canApply ? (
                <button
                  id="apply-btn"
                  onClick={() => setShowApply(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send size={15} /> Apply Now
                </button>
              ) : null}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { icon: <MapPin size={14} />, label: job.location },
              { icon: <DollarSign size={14} />, label: formatSalary(job.salaryMin, job.salaryMax) },
              { icon: <Users size={14} />, label: `${job._count.applications} applicants` },
              { icon: <Clock size={14} />, label: new Date(job.createdAt).toLocaleDateString() },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                <span className="text-violet-600">{m.icon}</span> {m.label}
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {job.skills.map((s) => (
              <span key={s} className="badge badge-purple">{s}</span>
            ))}
          </div>

          {/* Description */}
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-3">Job Description</h2>
            <div className="text-slate-700 leading-relaxed whitespace-pre-line text-base">
              {job.description}
            </div>
          </div>
        </div>

        {/* Apply panel */}
        {showApply && (
          <div className="glass p-5 fade-up">
            <h3 className="font-semibold text-xl mb-4">Your Application</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload Resume <span className="text-violet-600">(PDF or DOCX)</span>
              </label>
              <div className="relative group">
                <input
                  type="file"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-violet-200 rounded-xl hover:border-violet-500 hover:bg-violet-50/50 transition-all cursor-pointer"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Send size={18} className="text-violet-600 -rotate-45" />
                    </div>
                    <p className="text-sm text-slate-600">
                      {resumeFile ? <span className="font-semibold text-violet-700">{resumeFile.name}</span> : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">AI will match your skills automatically</p>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cover Letter <span className="text-slate-500">(optional)</span>
              </label>
              <textarea
                id="cover-letter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={3}
                placeholder="Tell the employer why you're a great fit…"
                className="input-field resize-none"
                maxLength={2000}
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleApply} 
                disabled={applying || !resumeFile} 
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Submit Application
                  </>
                )}
              </button>
              <button
                onClick={() => setShowApply(false)}
                className="px-3 py-1.5 rounded-lg border border-violet-200 text-slate-500 hover:text-slate-900 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
