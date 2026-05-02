'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';

export default function CreateJobPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', location: '', salaryMin: '', salaryMax: '', skills: [],
  });

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm({ ...form, skills: [...form.skills, s] });
    }
    setSkillInput('');
  };

  const removeSkill = (s) =>
    setForm({ ...form, skills: form.skills.filter((sk) => sk !== s) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || user?.role !== 'EMPLOYER') {
      toast.error('Only employers can post jobs');
      return;
    }
    if (form.skills.length === 0) { toast.error('Add at least one skill'); return; }

    setLoading(true);
    try {
      await api.post('/jobs', {
        ...form,
        salaryMin: form.salaryMin ? parseInt(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? parseInt(form.salaryMax) : undefined,
      });
      toast.success('Job posted successfully!');
      router.push('/jobs');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-28 pb-16">
        <h1 className="text-sm font-bold mb-2">Post a Job</h1>
        <p className="text-slate-500 text-sm mb-8">Fill in the details — AI will score applicants automatically.</p>

        <form onSubmit={handleSubmit} className="glass p-5 space-y-6 fade-up">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Job Title *</label>
            <input
              id="job-title"
              className="input-field"
              placeholder="e.g. Senior React Developer"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
            <input
              id="job-loc"
              className="input-field"
              placeholder="e.g. Remote, New York, London"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Min Salary ($)</label>
              <input
                id="salary-min"
                type="number"
                className="input-field"
                placeholder="60000"
                value={form.salaryMin}
                onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Max Salary ($)</label>
              <input
                id="salary-max"
                type="number"
                className="input-field"
                placeholder="120000"
                value={form.salaryMax}
                onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Required Skills *</label>
            <div className="flex gap-2 mb-3">
              <input
                id="skill-input"
                className="input-field flex-1"
                placeholder="e.g. React"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              />
              <button type="button" onClick={addSkill} className="btn-primary px-3 py-1.5">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.skills.map((s) => (
                <span key={s} className="badge badge-purple flex items-center gap-1.5">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-400 transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Job Description * <span className="text-slate-500 font-normal">(AI uses this for matching)</span>
            </label>
            <textarea
              id="job-desc"
              className="input-field resize-none"
              rows={7}
              placeholder="Describe the role, responsibilities, and requirements in detail. The more specific you are, the better the AI matching."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              minLength={20}
            />
          </div>

          <button type="submit" className="btn-primary w-full py-3 text-sm" disabled={loading}>
            {loading ? 'Posting…' : '🚀 Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
}
