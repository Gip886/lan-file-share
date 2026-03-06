export declare const config: {
    port: number;
    jwtSecret: string;
    jwtExpiresIn: string;
    databaseUrl: string;
    staticDir: string;
    uploadDir: string;
    thumbnailDir: string;
};
export { prisma } from './database';
