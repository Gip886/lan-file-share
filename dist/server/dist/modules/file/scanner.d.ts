export interface ScanResult {
    added: number;
    updated: number;
    errors: string[];
    warnings: string[];
    details: {
        totalFiles: number;
        previewableFiles: number;
        skippedFiles: number;
        pathResults: Array<{
            path: string;
            exists: boolean;
            fileCount: number;
            error?: string;
        }>;
    };
}
export declare class FileScanner {
    /**
     * 扫描所有启用的存储路径
     */
    scanAll(): Promise<ScanResult>;
    /**
     * 扫描单个路径
     */
    private scanPath;
    /**
     * 递归获取所有可预览文件（视频、音频、图片、文档、字幕）
     */
    private getPreviewableFiles;
    /**
     * 提取视频元数据
     */
    private extractMetadata;
}
