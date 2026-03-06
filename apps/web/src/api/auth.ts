import api from './client';
import type { LoginResponse, User } from '@lan-file-share/types';

export const authApi = {
  // 登录
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }),

  // 获取当前用户信息
  me: () => api.get<{ success: boolean; data: User }>('/auth/me'),

  // 修改密码
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/password', { oldPassword, newPassword }),
};