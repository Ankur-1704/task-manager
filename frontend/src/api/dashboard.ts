import client from './client';
import { DashboardData } from '../types';

export const getDashboard = () =>
  client.get<DashboardData>('/dashboard/').then((r) => r.data);
