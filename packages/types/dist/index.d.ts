export interface User {
    id: string;
    username: string;
    role: 'admin' | 'user';
    createdAt: Date;
    updatedAt: Date;
}
export interface LoginRequest {
    username: string;
    password: string;
}
export interface LoginResponse {
    token: string;
    user: User;
}
export interface FileItem {
    id: string;
    name: string;
    path: string;
    size: number;
    mimeType: string;
    category: 'video' | 'audio' | 'image' | 'subtitle' | 'document' | 'other';
    duration?: number;
    width?: number;
    height?: number;
    thumbnail?: string;
    storagePathId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface StoragePath {
    id: string;
    path: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface AccessLog {
    id: string;
    userId: string;
    fileId: string;
    ip: string;
    device: string;
    bytesSent: number;
    duration: number;
    createdAt: Date;
}
export interface DeviceInfo {
    ip: string;
    device: string;
    lastSeen: Date;
    requestCount: number;
    totalBytes: number;
}
export interface MonitorStats {
    totalFiles: number;
    totalSize: number;
    todayAccess: number;
    todayTraffic: number;
    activeDevices: number;
}
export interface TrafficStats {
    date: string;
    requests: number;
    bytes: number;
}
export interface TranscodeJob {
    id: string;
    fileId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    outputPath?: string;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export type WsEvent = {
    type: 'access';
    data: AccessLog;
} | {
    type: 'stats';
    data: MonitorStats;
} | {
    type: 'transcode_progress';
    data: {
        jobId: string;
        progress: number;
    };
};
//# sourceMappingURL=index.d.ts.map