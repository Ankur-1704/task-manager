import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getProject, updateProject, deleteProject } from '../api/projects';
import { getTasks } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { Task, TaskStatus } from '../types';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import MemberPanel from '../components/MemberPanel';
import { cn } from '../utils';

type MobileTab = 'board' | 'team';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [taskModal, setTaskModal] = useState<{
    open: boolean;
    task: Task | null;
    defaultStatus: TaskStatus;
  }>({ open: false, task: null, defaultStatus: 'TODO' });

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [mobileTab, setMobileTab] = useState<MobileTab>('board');

  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => getTasks(id!),
    enabled: !!id,
    refetchOnWindowFocus: true,
  });

  const currentMember = project?.members.find((m) => m.user.id === user?.id);
  const isAdmin = currentMember?.role === 'ADMIN';

  const updateMutation = useMutation({
    mutationFn: () =>
      updateProject(id!, { name: editName.trim(), description: editDesc.trim() || undefined }),
    onSuccess: () => {
      toast.success('Project updated');
      qc.invalidateQueries({ queryKey: ['project', id] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      setEditing(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? 'Failed to update project'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(id!),
    onSuccess: () => {
      toast.success('Project deleted');
      qc.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? 'Failed to delete project'),
  });

  const startEditing = () => {
    setEditName(project?.name ?? '');
    setEditDesc(project?.description ?? '');
    setEditing(true);
  };

  if (projectLoading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="space-y-4">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-9 w-64" />
          <div className="skeleton h-4 w-80" />
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="p-4 sm:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
          Project not found or you don't have access.{' '}
          <Link to="/projects" className="font-semibold underline">Back to projects</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div
        className="px-4 sm:px-8 py-5 sm:py-6 shrink-0 animate-fade-in-down border-b border-white/10"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)' }}
      >
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-purple-300/70 hover:text-purple-200 transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          All Projects
        </Link>

        {editing ? (
          <div className="space-y-3">
            <input
              type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
              className="text-xl sm:text-2xl font-bold text-white bg-white/10 border border-white/20 rounded-xl px-4 py-2 w-full max-w-lg focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-white/40"
              autoFocus
            />
            <textarea
              value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Add a description..." rows={2}
              className="w-full max-w-lg text-sm bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 text-white/80 placeholder:text-white/30"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !editName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-all shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                <CheckIcon className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/20 text-sm font-medium rounded-lg text-white/70 hover:bg-white/20 transition-all"
              >
                <XMarkIcon className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight truncate">{project.name}</h1>
              {project.description && (
                <p className="text-purple-200/70 text-sm mt-1.5 leading-relaxed line-clamp-2 sm:line-clamp-none">
                  {project.description}
                </p>
              )}
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium rounded-xl text-white/70 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <PencilIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => { if (confirm(`Delete "${project.name}"?`)) deleteMutation.mutate(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium rounded-xl text-red-300 hover:text-red-200 transition-all"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile tab bar ── */}
      <div className="lg:hidden flex bg-white border-b border-gray-200 shrink-0">
        {([
          { key: 'board', label: 'Board', icon: ViewColumnsIcon },
          { key: 'team', label: `Team (${project.members.length})`, icon: UserGroupIcon },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMobileTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-all',
              mobileTab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Kanban — hidden on mobile when team tab active */}
        <div className={cn(
          'flex-1 p-3 sm:p-6 overflow-auto',
          mobileTab === 'team' ? 'hidden lg:flex lg:flex-1' : 'flex flex-1'
        )}>
          {tasksLoading ? (
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="min-w-[260px] sm:min-w-[290px] h-96 skeleton" />
              ))}
            </div>
          ) : (
            <KanbanBoard
              tasks={tasks}
              isAdmin={isAdmin}
              members={project.members}
              onAddTask={(defaultStatus) => setTaskModal({ open: true, task: null, defaultStatus })}
              onTaskClick={(task) => setTaskModal({ open: true, task, defaultStatus: task.status })}
            />
          )}
        </div>

        {/* Members — sidebar on desktop, full panel on mobile when team tab */}
        <div className={cn(
          'border-gray-200 bg-gray-50 overflow-y-auto',
          // desktop: always visible as right sidebar
          'hidden lg:block lg:w-72 lg:shrink-0 lg:border-l lg:p-4 lg:animate-slide-left lg:delay-200',
          // mobile: show when team tab active
          mobileTab === 'team' ? 'block w-full p-4 lg:hidden' : ''
        )}>
          <MemberPanel
            projectId={id!}
            members={project.members}
            ownerId={project.owner_id}
            isAdmin={isAdmin}
            currentUserId={user?.id ?? ''}
          />
        </div>
      </div>

      {/* Task Modal */}
      {taskModal.open && (
        <TaskModal
          projectId={id!}
          task={taskModal.task}
          defaultStatus={taskModal.defaultStatus}
          members={project.members}
          isAdmin={isAdmin}
          currentUserId={user?.id ?? ''}
          onClose={() => setTaskModal({ open: false, task: null, defaultStatus: 'TODO' })}
        />
      )}
    </div>
  );
}
