import { CalendarIcon } from '@heroicons/react/24/outline';
import { Task } from '../types';
import { cn, formatDate, getInitials, isDateOverdue, PRIORITY_COLORS } from '../utils';

const PRIORITY_GRADIENT: Record<string, string> = {
  LOW: 'linear-gradient(135deg, #10b981, #06b6d4)',
  MEDIUM: 'linear-gradient(135deg, #f59e0b, #f97316)',
  HIGH: 'linear-gradient(135deg, #ef4444, #ec4899)',
};

const STATUS_DOT: Record<string, string> = {
  TODO: 'bg-slate-300',
  IN_PROGRESS: 'bg-blue-500',
  DONE: 'bg-emerald-500',
};

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const overdue = isDateOverdue(task.due_date) && task.status !== 'DONE';

  return (
    <div
      onClick={() => onClick(task)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group overflow-hidden"
    >
      {/* Priority gradient top bar */}
      <div
        className="h-0.5 w-full"
        style={{ background: PRIORITY_GRADIENT[task.priority] }}
      />

      <div className="p-3.5">
        {/* Status dot + priority badge */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className={cn('h-2 w-2 rounded-full shrink-0', STATUS_DOT[task.status])} />
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
              PRIORITY_COLORS[task.priority]
            )}
          >
            {task.priority}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 mb-3 group-hover:text-indigo-700 transition-colors">
          {task.title}
        </p>

        {/* Description snippet */}
        {task.description && (
          <p className="text-xs text-gray-400 line-clamp-1 mb-3 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          {task.due_date ? (
            <div
              className={cn(
                'flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg',
                overdue
                  ? 'bg-red-50 text-red-600'
                  : 'bg-gray-50 text-gray-500'
              )}
            >
              <CalendarIcon className="h-3 w-3 shrink-0" />
              {overdue ? '⚠ ' : ''}{formatDate(task.due_date)}
            </div>
          ) : (
            <span />
          )}

          {task.assignee ? (
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                title={task.assignee.name}
              >
                {getInitials(task.assignee.name)}
              </div>
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 ml-auto shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
