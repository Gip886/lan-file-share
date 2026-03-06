import api from './client';
import type { FileItem, StoragePath, PaginatedResponse } from '@lan-file-share/types';

export interface FileStats {
  category: string;
  count: number;
  totalSize: string;
}

export const fileApi = {
  // 获取文件列表
  getFiles: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    storagePathId?: string;
    category?: string;
    folder?: string;
  }) =>
    api.get<PaginatedResponse<FileItem & { storagePath: { id: string; path: string } }>>('/files', { params }),

  // 获取文件详情
  getFile: (id: string) =>
    api.get<{ success: boolean; data: FileItem }>(`/files/${id}`),

  // 删除文件
  deleteFile: (id: string) =>
    api.delete(`/files/${id}`),

  // 批量删除文件
  batchDelete: (ids: string[]) =>
    api.post<{ success: boolean; message: string; data: { count: number } }>('/files/batch-delete', { ids }),

  // 批量删除文件夹内的文件
  batchDeleteFolder: (folder: string, storagePathId?: string) =>
    api.post<{ success: boolean; message: string; data: { count: number } }>('/files/batch-delete-folder', { folder, storagePathId }),

  // 获取文件夹列表
  getFolders: (params?: { category?: string; storagePathId?: string }) =>
    api.get<{ success: boolean; data: string[] }>('/files/folders', { params }),

  // 获取分类统计
  getStats: () =>
    api.get<{ success: boolean; data: FileStats[] }>('/files/stats'),

  // 获取存储路径列表
  getStoragePaths: () =>
    api.get<{ success: boolean; data: StoragePath[] }>('/files/storage-paths'),

  // 添加存储路径
  addStoragePath: (path: string) =>
    api.post('/files/storage-paths', { path }),

  // 更新存储路径
  updateStoragePath: (id: string, enabled: boolean) =>
    api.put(`/files/storage-paths/${id}`, { enabled }),

  // 删除存储路径
  deleteStoragePath: (id: string) =>
    api.delete(`/files/storage-paths/${id}`),

  // 扫描文件
  scanFiles: () =>
    api.post<{ success: boolean; data: { added: number; updated: number; errors: string[] } }>('/files/scan'),
};
