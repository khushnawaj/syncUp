import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, BarChart3, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-24 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 badge badge-purple mb-6 fade-up">
          <Zap size={12} /> AI-Powered Job Matching
        </div>
        <h1 className="text-sm sm:text-sm md:text-sm font-bold tracking-tight mb-6 fade-up leading-tight">
          Find Jobs That{' '}
          <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
            Match Your Skills
          </span>
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl mx-auto mb-10 fade-up">
          SyncUp uses AI to score your resume against job descriptions, giving employers instant
          insight and giving you a genuine edge in the hiring process.
        </p>
        <div className="flex items-center justify-center gap-4 fade-up flex-wrap">
          <Link href="/register" className="btn-primary flex items-center gap-2 py-3 px-6 text-sm">
            Start for Free <ArrowRight size={16} />
          </Link>
          <Link
            href="/jobs"
            className="px-3 py-1.5 rounded-xl border border-[rgba(139,92,246,0.3)] text-slate-700 hover:border-violet-500/60 hover:text-slate-900 transition-all text-sm font-medium"
          >
            Browse Jobs
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 pb-24 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Jobs', value: '2,400+' },
          { label: 'Companies', value: '380+' },
          { label: 'Placements', value: '12,000+' },
          { label: 'Avg Match Score', value: '87%' },
        ].map((s) => (
          <div key={s.label} className="glass p-5 text-center">
            <div className="text-sm font-bold text-violet-600 mb-1">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-32">
        <h2 className="text-sm font-bold text-center mb-12">Why SyncUp?</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: <Zap size={22} className="text-violet-600" />,
              title: 'AI Match Scoring',
              desc: 'GPT-powered scoring rates your resume against every job description — no black box.',
            },
            {
              icon: <Shield size={22} className="text-violet-600" />,
              title: 'Secure & Private',
              desc: 'Your resume lives in encrypted S3 storage. Only employers you apply to can view it.',
            },
            {
              icon: <BarChart3 size={22} className="text-violet-600" />,
              title: 'Real-time Updates',
              desc: 'WebSocket notifications the moment an employer reviews or shortlists your application.',
            },
          ].map((f) => (
            <div key={f.title} className="glass p-7 hover:border-violet-300 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
