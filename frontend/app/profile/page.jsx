'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FileText, Upload, User, ExternalLink, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Request presigned URL
      const { data: presignRes } = await api.post('/upload/presign', { fileType: file.type });
      const { presignedUrl, publicUrl } = presignRes.data;

      // 2. Upload directly to S3
      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      // 3. Confirm with backend to update user record
      const { data: confirmRes } = await api.post('/upload/confirm', { resumeUrl: publicUrl });
      updateUser(confirmRes.data);
      
      toast.success('Resume updated successfully');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <h1 className="text-3xl font-bold mb-8 text-slate-900">Your Profile</h1>
        
        <div className="space-y-6">
          {/* User Info Card */}
          <div className="glass p-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-violet-500/20">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
                <p className="text-slate-500 text-lg">{user?.email}</p>
                <span className="badge badge-purple mt-3 px-3 py-1">{user?.role}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8">
              <h3 className="text-lg font-semibold mb-4 text-slate-900">Account Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Type</p>
                  <p className="text-slate-700 font-medium">{user?.role === 'EMPLOYER' ? 'Hiring Manager' : 'Job Seeker'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-emerald-600 font-medium">Active Verified</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Management Card */}
          {user?.role === 'JOB_SEEKER' && (
            <div className="glass p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Resume Management</h3>
                  <p className="text-slate-500 text-sm">Upload your primary resume for AI matching</p>
                </div>
                {user?.resumeUrl && (
                  <a 
                    href={user.resumeUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-violet-600 hover:text-violet-700 text-sm font-semibold transition-colors"
                  >
                    View Current <ExternalLink size={14} />
                  </a>
                )}
              </div>

              <div className="relative group">
                <input
                  type="file"
                  id="profile-resume"
                  className="hidden"
                  onChange={handleResumeUpload}
                  disabled={uploading}
                  accept=".pdf,.docx"
                />
                <label
                  htmlFor="profile-resume"
                  className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                    uploading 
                      ? 'bg-slate-50 border-slate-200 cursor-not-allowed' 
                      : 'border-violet-200 hover:border-violet-500 hover:bg-violet-50/30'
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-violet-600" size={32} />
                      <p className="text-sm font-medium text-slate-600">Uploading to Secure S3...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={24} className="text-violet-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">
                        {user?.resumeUrl ? 'Update your resume' : 'Upload your first resume'}
                      </p>
                      <p className="text-xs text-slate-400">PDF or DOCX • Max 10MB</p>
                    </div>
                  )}
                </label>
              </div>
              
              {user?.resumeUrl && (
                <div className="mt-6 flex items-start gap-4 p-4 rounded-xl bg-violet-50/50 border border-violet-100">
                  <FileText className="text-violet-600 shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Current Resume Active</p>
                    <p className="text-xs text-slate-500 mt-0.5">Your resume is ready for AI-powered job matching.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
