import api from './client';
import type { User } from '@lan-file-share/types';

export const adminApi = {
  // 获取用户列表
  getUsers: () =>
    api.get<{ success: boolean; data: (User & { _count: { accessLogs: number } })[] }>('/admin/users'),

  // 创建用户
  createUser: (username: string, password: string, role: string) =>
    api.post('/admin/users', { username, password, role }),

  // 更新用户
  updateUser: (id: string, data: { role?: string; password?: string }) =>
    api.put(`/admin/users/${id}`, data),

  // 删除用户
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),

  // 获取系统信息
  getSystemInfo: () =>
    api.get<{
      success: boolean;
      data: {
        userCount: number;
        fileCount: number;
        storagePathCount: number;
        accessLogCount: number;
        uptime: number;
        nodeVersion: string;
        platform: string;
      };
    }>('/admin/system'),
};