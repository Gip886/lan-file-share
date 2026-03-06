import api from './client';
import type { AccessLog, DeviceInfo, MonitorStats, TrafficStats } from '@lan-file-share/types';

export const monitorApi = {
  // 获取统计数据
  getStats: () =>
    api.get<{ success: boolean; data: MonitorStats }>('/monitor/stats'),

  // 获取访问日志
  getLogs: (params?: { page?: number; pageSize?: number; userId?: string; fileId?: string; ip?: string }) =>
    api.get<{ success: boolean; data: { items: (AccessLog & { user?: { id: string; username: string }; file?: { id: string; name: string } })[]; total: number; page: number; pageSize: number } }>('/monitor/logs', { params }),

  // 获取设备列表
  getDevices: () =>
    api.get<{ success: boolean; data: DeviceInfo[] }>('/monitor/devices'),

  // 获取流量统计
  getTraffic: (days?: number) =>
    api.get<{ success: boolean; data: TrafficStats[] }>('/monitor/traffic', { params: { days } }),
};