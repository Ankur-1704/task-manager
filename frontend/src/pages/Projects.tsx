import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  FolderIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { getProjects } from '../api/projects';
import { formatDate } from '../utils';
import ProjectModal from '../components/ProjectModal';

const PROJECT_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #3b82f6, #06b6d4)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #14b8a6, #6366f1)',
];

export default function Projects() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    refetchOnWindowFocus: true,
  });

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 animate-fade-in-down gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <RectangleStackIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400 shrink-0" />
            <p className="text-[11px] sm:text-xs font-semibold text-indigo-500 uppercase tracking-widest">All Projects</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''} you're a member of
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 text-white text-sm font-semibold rounded-xl shadow-lg active:scale-95 transition-all shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
        >
          <PlusIcon className="h-4 w-4" />
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Search */}
      {projects.length > 0 && (
        <div className="relative mb-6 animate-fade-in">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full max-w-sm pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
          />
        </div>
      )}

      {/* Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-52" />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 text-sm">
          Failed to load projects. Please refresh.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-28 text-center animate-fade-in-up">
          <div
            className="h-24 w-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl animate-float"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 8px 30px rgba(99,102,241,0.35)' }}
          >
            <FolderIcon className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
            Create your first project to start organising tasks and collaborating with your team.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
          >
            <PlusIcon className="h-4 w-4" />
            Create First Project
          </button>
        </div>
      )}

      {/* No search results */}
      {!isLoading && !error && projects.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <p className="text-gray-400 text-sm">No projects match "<span className="font-medium text-gray-600">{search}</span>"</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project, i) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              style={{ animationDelay: `${i * 60}ms` }}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col overflow-hidden animate-fade-in-up"
            >
              {/* Gradient top strip */}
              <div
                className="h-1.5 w-full"
                style={{ background: PROJECT_GRADIENTS[i % PROJECT_GRADIENTS.length] }}
              />

              <div className="p-6 flex flex-col flex-1">
                {/* Icon */}
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300"
                  style={{ background: PROJECT_GRADIENTS[i % PROJECT_GRADIENTS.length] }}
                >
                  <FolderIcon className="h-5.5 h-6 w-6 text-white" />
                </div>

                {/* Name */}
                <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-indigo-700 transition-colors leading-tight">
                  {project.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-500 line-clamp-2 flex-1 leading-relaxed">
                  {project.description || <span className="italic text-gray-300">No description</span>}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-50">
                  <span className="text-xs text-gray-400">{formatDate(project.created_at)}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-indigo-500 group-hover:gap-2 transition-all">
                    Open
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
