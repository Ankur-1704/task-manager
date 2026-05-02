import client from './client';
import { Task, TaskPriority, TaskStatus } from '../types';

export interface TaskCreateData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  assignee_id?: string | null;
}

export interface TaskUpdateData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  assignee_id?: string | null;
}

export const getTasks = (
  projectId: string,
  params?: { status?: string; assignee_id?: string; overdue?: boolean }
) =>
  client
    .get<Task[]>(`/projects/${projectId}/tasks/`, { params })
    .then((r) => r.data);

export const createTask = (projectId: string, data: TaskCreateData) =>
  client.post<Task>(`/projects/${projectId}/tasks/`, data).then((r) => r.data);

export const updateTask = (projectId: string, taskId: string, data: TaskUpdateData) =>
  client.put<Task>(`/projects/${projectId}/tasks/${taskId}`, data).then((r) => r.data);

export const updateTaskStatus = (projectId: string, taskId: string, status: TaskStatus) =>
  client
    .patch<Task>(`/projects/${projectId}/tasks/${taskId}/status`, { status })
    .then((r) => r.data);

export const deleteTask = (projectId: string, taskId: string) =>
  client.delete(`/projects/${projectId}/tasks/${taskId}`).then((r) => r.data);
