import crypto from 'crypto-js';
/**
 * 生成唯一 ID
 */
export function generateId() {
    return crypto.lib.WordArray.random(16).toString();
}
/**
 * 格式化文件大小
 */
export function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * 格式化时长（秒转换为 HH:MM:SS）
 */
export function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
/**
 * 解析 HTTP Range 头
 */
export function parseRangeHeader(range, fileSize) {
    const matches = /bytes=(\d+)-(\d*)/.exec(range);
    if (!matches)
        return null;
    const start = parseInt(matches[1], 10);
    const end = matches[2] ? parseInt(matches[2], 10) : fileSize - 1;
    if (start >= fileSize || end >= fileSize || start > end) {
        return null;
    }
    return [start, end];
}
/**
 * 获取文件扩展名
 */
export function getFileExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.slice(lastDot + 1).toLowerCase();
}
/**
 * 获取 MIME 类型
 */
export function getMimeType(filename) {
    const ext = getFileExtension(filename);
    const mimeTypes = {
        // 视频
        mp4: 'video/mp4',
        mkv: 'video/x-matroska',
        avi: 'video/x-msvideo',
        mov: 'video/quicktime',
        wmv: 'video/x-ms-wmv',
        flv: 'video/x-flv',
        webm: 'video/webm',
        hevc: 'video/hevc',
        m4v: 'video/mp4',
        mpg: 'video/mpeg',
        mpeg: 'video/mpeg',
        m2ts: 'video/mp2t',
        ts: 'video/mp2t',
        vob: 'video/x-ms-vob',
        ogv: 'video/ogg',
        '3gp': 'video/3gpp',
        '3g2': 'video/3gpp2',
        rm: 'application/vnd.rn-realmedia',
        rmvb: 'application/vnd.rn-realmedia-vbr',
        asf: 'video/x-ms-asf',
        divx: 'video/divx',
        f4v: 'video/x-f4v',
        mts: 'video/mp2t',
        m2v: 'video/mpeg',
        // 音频
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        flac: 'audio/flac',
        aac: 'audio/aac',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4',
        wma: 'audio/x-ms-wma',
        ape: 'audio/x-ape',
        opus: 'audio/opus',
        // 图片
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        bmp: 'image/bmp',
        svg: 'image/svg+xml',
        heic: 'image/heic',
        heif: 'image/heif',
        tiff: 'image/tiff',
        ico: 'image/x-icon',
        // 字幕
        srt: 'text/plain',
        ass: 'text/plain',
        ssa: 'text/plain',
        vtt: 'text/vtt',
        sub: 'text/plain',
        // 文档
        txt: 'text/plain',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        md: 'text/markdown',
        json: 'application/json',
        xml: 'application/xml',
        html: 'text/html',
        csv: 'text/csv',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}
/**
 * 判断是否为视频文件
 */
export function isVideoFile(filename) {
    const videoExts = [
        // 常见视频格式
        'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'hevc',
        // 更多视频格式
        'm4v', 'mpg', 'mpeg', 'm2ts', 'ts', 'vob', 'ogv', '3gp', '3g2',
        'rm', 'rmvb', 'asf', 'divx', 'f4v', 'mts', 'm2v', 'vro',
    ];
    return videoExts.includes(getFileExtension(filename));
}
/**
 * 判断是否为音频文件
 */
export function isAudioFile(filename) {
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'ape', 'alac', 'opus'];
    return audioExts.includes(getFileExtension(filename));
}
/**
 * 判断是否为媒体文件（视频或音频）
 */
export function isMediaFile(filename) {
    return isVideoFile(filename) || isAudioFile(filename);
}
/**
 * 判断是否为图片文件
 */
export function isImageFile(filename) {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif', 'tiff', 'ico'];
    return imageExts.includes(getFileExtension(filename));
}
/**
 * 判断是否为字幕文件
 */
export function isSubtitleFile(filename) {
    const subtitleExts = ['srt', 'ass', 'ssa', 'vtt', 'sub', 'idx', 'sup'];
    return subtitleExts.includes(getFileExtension(filename));
}
/**
 * 判断是否为文档文件
 */
export function isDocumentFile(filename) {
    const docExts = ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'md', 'json', 'xml', 'html', 'csv'];
    return docExts.includes(getFileExtension(filename));
}
/**
 * 判断是否为可预览的文件（视频、音频、图片、文本、字幕）
 */
export function isPreviewableFile(filename) {
    return isMediaFile(filename) || isImageFile(filename) || isSubtitleFile(filename) || isDocumentFile(filename);
}
/**
 * 获取文件类型分类
 */
export function getFileCategory(filename) {
    if (isVideoFile(filename))
        return 'video';
    if (isAudioFile(filename))
        return 'audio';
    if (isImageFile(filename))
        return 'image';
    if (isSubtitleFile(filename))
        return 'subtitle';
    if (isDocumentFile(filename))
        return 'document';
    return 'other';
}
/**
 * 解析 User-Agent 获取设备信息
 */
export function parseUserAgent(userAgent) {
    if (!userAgent)
        return 'Unknown';
    // 常见设备/浏览器识别
    const patterns = [
        { pattern: /AppleTV/i, name: 'Apple TV' },
        { pattern: /Android.*TV/i, name: 'Android TV' },
        { pattern: /SmartTV/i, name: 'Smart TV' },
        { pattern: /Roku/i, name: 'Roku' },
        { pattern: /Chromecast/i, name: 'Chromecast' },
        { pattern: /iPad/i, name: 'iPad' },
        { pattern: /iPhone/i, name: 'iPhone' },
        { pattern: /Android/i, name: 'Android' },
        { pattern: /Windows/i, name: 'Windows' },
        { pattern: /Macintosh|Mac OS X/i, name: 'Mac' },
        { pattern: /Linux/i, name: 'Linux' },
        { pattern: /Chrome/i, name: 'Chrome' },
        { pattern: /Firefox/i, name: 'Firefox' },
        { pattern: /Safari/i, name: 'Safari' },
        { pattern: /Edge/i, name: 'Edge' },
    ];
    for (const { pattern, name } of patterns) {
        if (pattern.test(userAgent)) {
            return name;
        }
    }
    return 'Unknown';
}
/**
 * 延迟执行
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=index.js.map