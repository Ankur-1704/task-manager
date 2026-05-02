export type Role = 'ADMIN' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  is_verified: boolean;
  /** Only when API `DEV_EXPOSE_OTP_IN_RESPONSE` — never in production */
  dev_otp?: string | null;
  /** Signup: true if SMTP accepted the message (inbox not guaranteed) */
  email_sent?: boolean | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export interface Member {
  id: string;
  user: User;
  role: Role;
  joined_at: string;
}

export interface ProjectDetail extends Project {
  members: Member[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  project_id: string;
  assignee_id: string | null;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  assignee: User | null;
  created_by: User | null;
}

export interface TaskCounts {
  todo: number;
  in_progress: number;
  done: number;
}

export interface DashboardData {
  projects_count: number;
  task_counts: TaskCounts;
  overdue_tasks: Task[];
  recent_tasks: Task[];
}
