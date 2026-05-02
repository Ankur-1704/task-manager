import { PlusIcon } from '@heroicons/react/24/outline';
import { Task, TaskStatus, Member } from '../types';
import { cn } from '../utils';
import TaskCard from './TaskCard';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

const COLUMN_CONFIG: Record<TaskStatus, {
  label: string;
  gradient: string;
  iconColor: string;
  badgeBg: string;
  addBg: string;
  columnBg: string;
}> = {
  TODO: {
    label: 'To Do',
    gradient: 'linear-gradient(135deg, #64748b, #94a3b8)',
    iconColor: '#64748b',
    badgeBg: 'bg-slate-100 text-slate-600',
    addBg: 'hover:bg-slate-100 text-slate-400 hover:text-slate-700',
    columnBg: 'bg-slate-50/80',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    iconColor: '#3b82f6',
    badgeBg: 'bg-blue-100 text-blue-700',
    addBg: 'hover:bg-blue-50 text-blue-300 hover:text-blue-600',
    columnBg: 'bg-blue-50/60',
  },
  DONE: {
    label: 'Done',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    iconColor: '#10b981',
    badgeBg: 'bg-emerald-100 text-emerald-700',
    addBg: 'hover:bg-emerald-50 text-emerald-300 hover:text-emerald-600',
    columnBg: 'bg-emerald-50/60',
  },
};

interface KanbanBoardProps {
  tasks: Task[];
  isAdmin: boolean;
  members: Member[];
  onAddTask: (defaultStatus: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

export default function KanbanBoard({ tasks, isAdmin, onAddTask, onTaskClick }: KanbanBoardProps) {
  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s);

  return (
    <div className="flex gap-3 sm:gap-4 h-full overflow-x-auto pb-4 snap-x snap-mandatory sm:snap-none">
      {STATUSES.map((status, colIdx) => {
        const col = COLUMN_CONFIG[status];
        const colTasks = byStatus(status);

        return (
          <div
            key={status}
            style={{ animationDelay: `${colIdx * 90}ms` }}
            className={cn(
              'flex flex-col min-w-[260px] sm:min-w-[290px] max-w-[290px] rounded-2xl border border-gray-200/70 overflow-hidden shadow-sm animate-fade-in-up snap-start',
              col.columnBg
            )}
          >
            {/* Column header */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {/* Colored dot */}
                  <div
                    className="h-2.5 w-2.5 rounded-full shadow-sm"
                    style={{ background: col.gradient }}
                  />
                  <h3 className="text-sm font-bold text-gray-700">{col.label}</h3>
                  <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', col.badgeBg)}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddTask(status)}
                  className={cn(
                    'h-7 w-7 rounded-lg flex items-center justify-center transition-all active:scale-90',
                    col.addBg
                  )}
                  title="Add task"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Top gradient line */}
            <div className="h-0.5 mx-4 rounded-full mb-3" style={{ background: col.gradient }} />

            {/* Task list */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
              {colTasks.length === 0 ? (
                <div
                  onClick={() => onAddTask(status)}
                  className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-indigo-300 hover:bg-white/50 transition-all group/empty"
                >
                  <PlusIcon className="h-6 w-6 text-gray-300 group-hover/empty:text-indigo-400 transition-colors mb-1" />
                  <p className="text-xs text-gray-400 group-hover/empty:text-indigo-400 transition-colors">Add a task</p>
                </div>
              ) : (
                colTasks.map((task, taskIdx) => (
                  <div
                    key={task.id}
                    style={{ animationDelay: `${colIdx * 90 + taskIdx * 45}ms` }}
                    className="animate-fade-in-up"
                  >
                    <TaskCard task={task} onClick={onTaskClick} />
                  </div>
                ))
              )}
            </div>

            {/* Add task footer (non-admin) */}
            {!isAdmin && colTasks.length > 0 && (
              <div className="px-3 pb-3">
                <button
                  onClick={() => onAddTask(status)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-gray-400 hover:text-indigo-600 hover:bg-white border border-dashed border-gray-200 hover:border-indigo-300 transition-all"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add task
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
