/**
 * 生成唯一 ID
 */
export declare function generateId(): string;
/**
 * 格式化文件大小
 */
export declare function formatFileSize(bytes: number): string;
/**
 * 格式化时长（秒转换为 HH:MM:SS）
 */
export declare function formatDuration(seconds: number): string;
/**
 * 解析 HTTP Range 头
 */
export declare function parseRangeHeader(range: string, fileSize: number): [number, number] | null;
/**
 * 获取文件扩展名
 */
export declare function getFileExtension(filename: string): string;
/**
 * 获取 MIME 类型
 */
export declare function getMimeType(filename: string): string;
/**
 * 判断是否为视频文件
 */
export declare function isVideoFile(filename: string): boolean;
/**
 * 判断是否为音频文件
 */
export declare function isAudioFile(filename: string): boolean;
/**
 * 判断是否为媒体文件（视频或音频）
 */
export declare function isMediaFile(filename: string): boolean;
/**
 * 判断是否为图片文件
 */
export declare function isImageFile(filename: string): boolean;
/**
 * 判断是否为字幕文件
 */
export declare function isSubtitleFile(filename: string): boolean;
/**
 * 判断是否为文档文件
 */
export declare function isDocumentFile(filename: string): boolean;
/**
 * 判断是否为可预览的文件（视频、音频、图片、文本、字幕）
 */
export declare function isPreviewableFile(filename: string): boolean;
/**
 * 获取文件类型分类
 */
export declare function getFileCategory(filename: string): 'video' | 'audio' | 'image' | 'subtitle' | 'document' | 'other';
/**
 * 解析 User-Agent 获取设备信息
 */
export declare function parseUserAgent(userAgent: string): string;
/**
 * 延迟执行
 */
export declare function delay(ms: number): Promise<void>;
//# sourceMappingURL=index.d.ts.map