import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { createProject } from '../api/projects';

interface ProjectModalProps {
  onClose: () => void;
}

export default function ProjectModal({ onClose }: ProjectModalProps) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: () => createProject({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => { toast.success('Project created!'); qc.invalidateQueries({ queryKey: ['projects'] }); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? 'Failed to create project'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Project name is required');
    mutation.mutate();
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all placeholder:text-gray-400';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
              <RectangleStackIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">New Project</h2>
              <p className="text-purple-200 text-[11px] mt-0.5">Create a new workspace</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition-all">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign" className={inputClass}
              autoFocus maxLength={200}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Description <span className="font-normal text-gray-300 normal-case tracking-normal">optional</span>
            </label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?" rows={3}
              className={`${inputClass} resize-none`} maxLength={2000}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-all active:scale-[0.98] shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              {mutation.isPending ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
