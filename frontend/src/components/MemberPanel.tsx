import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlusIcon, TrashIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Member, Role } from '../types';
import { addMember, removeMember } from '../api/projects';
import { cn, getInitials } from '../utils';

interface MemberPanelProps {
  projectId: string;
  members: Member[];
  ownerId: string;
  isAdmin: boolean;
  currentUserId: string;
}

export default function MemberPanel({ projectId, members, ownerId, isAdmin, currentUserId }: MemberPanelProps) {
  const qc = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['project', projectId] });

  const addMutation = useMutation({
    mutationFn: () => addMember(projectId, { email: email.trim(), role }),
    onSuccess: (data) => {
      if (data.type === 'invited' && data.signup_link) {
        toast.success(data.message, { duration: 5000 });
        void navigator.clipboard.writeText(data.signup_link).then(
          () => toast.success('Signup link copied to clipboard'),
          () =>
            toast(`Copy this link: ${data.signup_link}`, {
              duration: 12000,
            }),
        );
      } else {
        toast.success('Member added');
      }
      setEmail('');
      setRole('MEMBER');
      setShowAddForm(false);
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? 'Failed to add member'),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(projectId, userId),
    onSuccess: () => { toast.success('Member removed'); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? 'Failed to remove member'),
  });

  const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #6366f1, #a855f7)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #10b981, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3.5 flex items-center justify-between"
        style={{ background: 'linear-gradient(to right, #f5f3ff, #faf5ff)' }}
      >
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-bold text-gray-800">Team</h3>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full text-violet-700"
            style={{ background: '#ede9fe' }}
          >
            {members.length}
          </span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
              showAddForm
                ? 'bg-gray-100 text-gray-500'
                : 'text-white shadow-md'
            )}
            style={showAddForm ? {} : { background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            <UserPlusIcon className="h-3.5 w-3.5" />
            {showAddForm ? 'Cancel' : 'Add'}
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && isAdmin && (
        <div className="px-4 py-4 bg-indigo-50/80 border-b border-indigo-100 animate-fade-in-down">
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-3">Invite by email</p>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            className="w-full text-sm border border-indigo-200 rounded-xl px-3.5 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white placeholder:text-gray-400"
            onKeyDown={(e) => e.key === 'Enter' && addMutation.mutate()}
          />
          <div className="flex gap-2">
            <select
              value={role} onChange={(e) => setRole(e.target.value as Role)}
              className="flex-1 text-xs border border-indigo-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !email.trim()}
              className="px-4 py-2 text-white text-xs font-bold rounded-xl disabled:opacity-60 transition-all active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              {addMutation.isPending ? '…' : 'Invite'}
            </button>
          </div>
        </div>
      )}

      {/* Member list */}
      <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
        {members.map((m, i) => (
          <div
            key={m.id}
            style={{ animationDelay: `${i * 55}ms` }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/70 transition-colors group animate-fade-in-up"
          >
            {/* Avatar */}
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
              style={{ background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }}
            >
              {getInitials(m.user.name)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold text-gray-800 truncate">{m.user.name}</p>
                {m.user.id === currentUserId && (
                  <span className="text-[10px] text-gray-400 font-medium">(you)</span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5">{m.user.email}</p>
            </div>

            {/* Role + remove */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold',
                  m.role === 'ADMIN'
                    ? 'text-amber-700'
                    : 'text-slate-500 bg-slate-100'
                )}
                style={m.role === 'ADMIN' ? { background: '#fef3c7' } : {}}
              >
                {m.role === 'ADMIN'
                  ? <ShieldCheckIcon className="h-3 w-3" />
                  : <UserIcon className="h-3 w-3" />
                }
                {m.role}
              </span>
              {isAdmin && m.user.id !== ownerId && m.user.id !== currentUserId && (
                <button
                  onClick={() => { if (confirm(`Remove ${m.user.name}?`)) removeMutation.mutate(m.user.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
