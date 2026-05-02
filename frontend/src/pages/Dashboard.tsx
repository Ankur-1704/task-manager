import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { getDashboard } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import { cn, formatDate, isDateOverdue, PRIORITY_COLORS, STATUS_COLORS, STATUS_LABELS } from '../utils';

const STAT_CARDS = (data: any) => [
  {
    label: 'Projects',
    value: data?.projects_count ?? 0,
    icon: FolderIcon,
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    glow: 'rgba(99,102,241,0.3)',
    light: '#eef2ff',
  },
  {
    label: 'To Do',
    value: data?.task_counts?.todo ?? 0,
    icon: ClockIcon,
    gradient: 'linear-gradient(135deg, #64748b, #94a3b8)',
    glow: 'rgba(100,116,139,0.25)',
    light: '#f8fafc',
  },
  {
    label: 'In Progress',
    value: data?.task_counts?.in_progress ?? 0,
    icon: ArrowTrendingUpIcon,
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    glow: 'rgba(59,130,246,0.3)',
    light: '#eff6ff',
  },
  {
    label: 'Done',
    value: data?.task_counts?.done ?? 0,
    icon: CheckCircleIcon,
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    glow: 'rgba(16,185,129,0.3)',
    light: '#f0fdf4',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="skeleton h-10 w-72" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="skeleton h-64" />
            <div className="skeleton h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm">
          Failed to load dashboard. Please refresh.
        </div>
      </div>
    );
  }

  const overdueCount = data?.overdue_tasks.length ?? 0;
  const stats = STAT_CARDS(data);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fade-in-down">
        <div className="flex items-center gap-2 mb-1">
          <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
          <p className="text-[11px] sm:text-xs font-semibold text-indigo-500 uppercase tracking-widest">Overview</p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Good {getGreeting()},{' '}
          <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-gray-400 mt-1.5 text-sm">
          Here's what's happening across your projects today.
        </p>
      </div>

      {/* Overdue banner */}
      {overdueCount > 0 && (
        <div
          className="mb-6 rounded-2xl px-5 py-4 flex items-center gap-3 animate-fade-in-down border"
          style={{ background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', borderColor: '#fecdd3' }}
        >
          <div className="h-8 w-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-sm text-red-700">
            <span className="font-bold">{overdueCount} task{overdueCount > 1 ? 's are' : ' is'} overdue.</span>
            {' '}Review and update them below.
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map(({ label, value, icon: Icon, gradient, glow, light }, i) => (
          <div
            key={label}
            style={{ animationDelay: `${i * 80}ms`, background: light }}
            className="rounded-2xl p-4 sm:p-5 border border-white shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up group cursor-default"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{ background: gradient, boxShadow: `0 4px 14px ${glow}` }}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up delay-300">

        {/* Overdue */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="px-5 py-4 flex items-center gap-2.5"
            style={{ background: 'linear-gradient(to right, #fff1f2, #fff)' }}
          >
            <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Overdue Tasks</h2>
            {overdueCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {overdueCount}
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {overdueCount === 0 ? (
              <div className="flex flex-col items-center py-12">
                <div className="h-14 w-14 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
                  <CheckCircleIcon className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">No overdue tasks right now</p>
              </div>
            ) : (
              data?.overdue_tasks.map((task, i) => (
                <div key={task.id} style={{ animationDelay: `${i * 50}ms` }}
                  className="px-5 py-3.5 flex items-center gap-3 hover:bg-red-50/40 transition-colors animate-fade-in-up">
                  <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold', PRIORITY_COLORS[task.priority])}>
                    {task.priority}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-red-500 mt-0.5 font-medium">Due {formatDate(task.due_date)}</p>
                    )}
                  </div>
                  <div className="h-2 w-2 rounded-full bg-red-400 shrink-0 animate-pulse" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="px-5 py-4 flex items-center gap-2.5"
            style={{ background: 'linear-gradient(to right, #eef2ff, #fff)' }}
          >
            <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center">
              <ClockIcon className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">My Recent Tasks</h2>
            <Link to="/projects" className="ml-auto text-xs text-indigo-500 hover:text-indigo-700 font-semibold">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(data?.recent_tasks?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center py-12">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                  <FolderIcon className="h-8 w-8 text-indigo-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">No tasks yet</p>
                <Link to="/projects" className="mt-2 text-xs text-indigo-500 font-semibold hover:text-indigo-700">
                  Browse projects →
                </Link>
              </div>
            ) : (
              data?.recent_tasks.map((task, i) => (
                <div key={task.id} style={{ animationDelay: `${i * 50}ms` }}
                  className="px-5 py-3.5 flex items-center gap-3 hover:bg-indigo-50/30 transition-colors animate-fade-in-up">
                  <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', STATUS_COLORS[task.status])}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    {task.due_date && (
                      <p className={cn('text-xs mt-0.5', isDateOverdue(task.due_date) && task.status !== 'DONE' ? 'text-red-500' : 'text-gray-400')}>
                        Due {formatDate(task.due_date)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
