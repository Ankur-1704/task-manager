import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Member, Task, TaskPriority, TaskStatus } from '../types';
import { createTask, deleteTask, updateTask } from '../api/tasks';
import { cn } from '../utils';

interface TaskModalProps {
  projectId: string;
  task: Task | null;
  defaultStatus?: TaskStatus;
  members: Member[];
  isAdmin: boolean;
  currentUserId: string;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: '#10b981' },
  { value: 'MEDIUM', label: 'Medium', color: '#f59e0b' },
  { value: 'HIGH', label: 'High', color: '#ef4444' },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

export default function TaskModal({
  projectId, task, defaultStatus = 'TODO', members, isAdmin, currentUserId, onClose,
}: TaskModalProps) {
  const qc = useQueryClient();
  const isEdit = !!task;
  const canEdit = isAdmin || (task ? task.assignee_id === currentUserId : true);

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? '');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['tasks', projectId] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: () => createTask(projectId, {
      title, description: description || undefined, status, priority,
      due_date: dueDate || null, assignee_id: assigneeId || null,
    }),
    onSuccess: () => { toast.success('Task created'); invalidate(); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? 'Failed to create task'),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateTask(projectId, task!.id, {
      title, description: description || null, status, priority,
      due_date: dueDate || null, assignee_id: assigneeId || null,
    }),
    onSuccess: () => { toast.success('Task updated'); invalidate(); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? 'Failed to update task'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(projectId, task!.id),
    onSuccess: () => { toast.success('Task deleted'); invalidate(); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? 'Failed to delete task'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Title is required');
    isEdit ? updateMutation.mutate() : createMutation.mutate();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const inputClass = cn(
    'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all',
    'placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 bg-gray-50/50'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header with gradient */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}
        >
          <h2 className="text-base font-bold text-white">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <div className="flex items-center gap-1">
            {isEdit && isAdmin && (
              <button
                onClick={() => { if (confirm('Delete this task?')) deleteMutation.mutate(); }}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition-all"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition-all">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?" className={inputClass}
              disabled={!canEdit} autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more context…" rows={3}
              className={cn(inputClass, 'resize-none')} disabled={!canEdit}
            />
          </div>

          {/* Priority picker */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Priority</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value} type="button"
                  disabled={!canEdit}
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all',
                    priority === opt.value
                      ? 'text-white border-transparent shadow-md'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  )}
                  style={priority === opt.value ? { background: opt.color, borderColor: opt.color } : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value} type="button" disabled={!canEdit}
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all',
                    status === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date + Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className={inputClass} disabled={!canEdit} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Assignee</label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
                className={inputClass} disabled={!isAdmin}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-all active:scale-[0.98] shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
