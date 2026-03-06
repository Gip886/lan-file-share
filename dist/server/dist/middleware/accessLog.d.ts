import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            accessLogId?: string;
            startTime?: number;
        }
    }
}
export declare const accessLogMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const trafficLogMiddleware: (fileIdParam: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
