import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/index';
import { isPreviewableFile, getFileCategory, getMimeType, isVideoFile } from '@lan-file-share/utils';
import ffmpeg from 'fluent-ffmpeg';

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

export class FileScanner {
  /**
   * 扫描所有启用的存储路径
   */
  async scanAll(): Promise<ScanResult> {
    const result: ScanResult = {
      added: 0,
      updated: 0,
      errors: [],
      warnings: [],
      details: {
        totalFiles: 0,
        previewableFiles: 0,
        skippedFiles: 0,
        pathResults: [],
      },
    };

    const storagePaths = await prisma.storagePath.findMany({
      where: { enabled: true },
    });

    if (storagePaths.length === 0) {
      result.warnings.push('没有配置任何启用的存储路径，请先在"存储路径管理"中添加路径');
      return result;
    }

    for (const sp of storagePaths) {
      const pathResult: {
        path: string;
        exists: boolean;
        fileCount: number;
        error?: string;
      } = {
        path: sp.path,
        exists: false,
        fileCount: 0,
      };

      if (!fs.existsSync(sp.path)) {
        const errorMsg = `路径不存在: ${sp.path}`;
        result.errors.push(errorMsg);
        pathResult.error = errorMsg;
        result.details.pathResults.push(pathResult);
        continue;
      }

      pathResult.exists = true;

      try {
        const scanResult = await this.scanPath(sp.id, sp.path, result.details);
        result.added += scanResult.added;
        result.updated += scanResult.updated;
        pathResult.fileCount = scanResult.added + scanResult.updated;
      } catch (error: any) {
        const errorMsg = `扫描 ${sp.path} 失败: ${error.message}`;
        result.errors.push(errorMsg);
        pathResult.error = errorMsg;
      }

      result.details.pathResults.push(pathResult);
    }

    // 添加汇总信息
    if (result.details.previewableFiles === 0 && result.errors.length === 0) {
      result.warnings.push(
        `扫描了 ${result.details.totalFiles} 个文件，但没有找到可预览的文件。` +
        `支持的视频: mp4, mkv, avi, mov 等 | 图片: jpg, png, gif 等 | 文档: txt, pdf, md 等`
      );
    }

    return result;
  }

  /**
   * 扫描单个路径
   */
  private async scanPath(
    storagePathId: string,
    dirPath: string,
    details: ScanResult['details']
  ): Promise<{ added: number; updated: number }> {
    const result = { added: 0, updated: 0 };

    const files = this.getPreviewableFiles(dirPath, details);

    for (const filePath of files) {
      try {
        const stats = fs.statSync(filePath);
        const existing = await prisma.file.findUnique({
          where: { path: filePath },
        });

        const category = getFileCategory(filePath);
        const fileInfo = {
          name: path.basename(filePath),
          path: filePath,
          size: BigInt(stats.size),
          mimeType: getMimeType(filePath),
          category,
          storagePathId,
        };

        if (existing) {
          // 更新文件信息
          await prisma.file.update({
            where: { id: existing.id },
            data: fileInfo,
          });
          result.updated++;
        } else {
          // 创建新文件记录
          const file = await prisma.file.create({
            data: fileInfo,
          });

          // 视频文件异步提取元数据
          if (isVideoFile(filePath)) {
            this.extractMetadata(file.id, filePath).catch(console.error);
          }

          result.added++;
        }
      } catch (error: any) {
        console.error(`处理文件 ${filePath} 失败:`, error.message);
      }
    }

    return result;
  }

  /**
   * 递归获取所有可预览文件（视频、音频、图片、文档、字幕）
   */
  private getPreviewableFiles(dirPath: string, details: ScanResult['details']): string[] {
    const files: string[] = [];
    const permissionErrors: string[] = [];

    // 需要跳过的系统目录
    const skipDirs = new Set([
      'Library', 'System', '.Trash', '.Spotlight', '.fseventsd',
      'Applications', 'usr', 'bin', 'sbin', 'etc', 'var', 'tmp',
      'dev', 'proc', 'sys', '.DocumentRevisions-V100', '.TemporaryItems',
      'node_modules', '.git', '.svn', '__pycache__', '.idea', '.vscode',
    ]);

    const scan = (currentPath: string, depth: number = 0) => {
      // 限制递归深度，防止扫描过深
      if (depth > 20) return;

      try {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          // 跳过隐藏文件和系统目录
          if (entry.name.startsWith('.') || skipDirs.has(entry.name)) {
            continue;
          }

          const fullPath = path.join(currentPath, entry.name);

          if (entry.isDirectory()) {
            scan(fullPath, depth + 1);
          } else if (entry.isFile()) {
            details.totalFiles++;
            if (isPreviewableFile(entry.name)) {
              files.push(fullPath);
              details.previewableFiles++;
            } else {
              details.skippedFiles++;
            }
          }
        }
      } catch (error: any) {
        // 权限错误静默跳过，记录到数组
        if (error.code === 'EACCES' || error.code === 'EPERM') {
          permissionErrors.push(currentPath);
        } else {
          console.error(`读取目录 ${currentPath} 失败:`, error.message);
        }
      }
    };

    scan(dirPath);

    // 如果有权限错误，输出汇总信息
    if (permissionErrors.length > 0) {
      console.log(`跳过 ${permissionErrors.length} 个无权限访问的目录`);
    }

    return files;
  }

  /**
   * 提取视频元数据
   */
  private async extractMetadata(fileId: string, filePath: string): Promise<void> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, async (err, metadata) => {
        if (err) {
          console.error(`提取元数据失败 ${filePath}:`, err.message);
          return resolve();
        }

        try {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          const duration = metadata.format.duration || 0;

          await prisma.file.update({
            where: { id: fileId },
            data: {
              duration,
              width: videoStream?.width,
              height: videoStream?.height,
            },
          });
        } catch (error: any) {
          console.error(`保存元数据失败:`, error.message);
        }

        resolve();
      });
    });
  }
}
