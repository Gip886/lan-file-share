import { Server } from 'http';
export declare function setupWebSocket(server: Server): void;
export declare function broadcast(data: any): void;
export declare function broadcastAccessLog(accessLogId: string): Promise<void>;
export declare function broadcastStats(): Promise<void>;
