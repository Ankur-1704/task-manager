import client from './client';
import { Member, Project, ProjectDetail, Role } from '../types';

export const getProjects = () =>
  client.get<Project[]>('/projects/').then((r) => r.data);

export const createProject = (data: { name: string; description?: string }) =>
  client.post<Project>('/projects/', data).then((r) => r.data);

export const getProject = (id: string) =>
  client.get<ProjectDetail>(`/projects/${id}`).then((r) => r.data);

export const updateProject = (id: string, data: { name?: string; description?: string }) =>
  client.put<Project>(`/projects/${id}`, data).then((r) => r.data);

export const deleteProject = (id: string) =>
  client.delete(`/projects/${id}`).then((r) => r.data);

export const getMembers = (projectId: string) =>
  client.get<Member[]>(`/projects/${projectId}/members`).then((r) => r.data);

export const addMember = (projectId: string, data: { email: string; role: Role }) =>
  client.post<Member>(`/projects/${projectId}/members`, data).then((r) => r.data);

export const removeMember = (projectId: string, userId: string) =>
  client.delete(`/projects/${projectId}/members/${userId}`).then((r) => r.data);
