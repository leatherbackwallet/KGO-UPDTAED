import { Request, Response, NextFunction } from 'express';
export declare const deduplicateRequests: () => (req: Request, res: Response, next: NextFunction) => void;
export declare const batchRelatedData: (batchConfig?: {
    batchSize?: number;
    batchTimeout?: number;
    enableBatching?: boolean;
}) => (req: Request, res: Response, next: NextFunction) => void;
export declare const enhanceProductsWithBatchLoading: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare class RequestQueue {
    private maxConcurrent;
    private queue;
    private active;
    private stats;
    constructor(options?: {
        maxConcurrent?: number;
    });
    add(requestFn: () => Promise<any>, priority?: string): Promise<any>;
    process(): Promise<void>;
    getStats(): {
        queueLength: number;
        active: number;
        queued: number;
        processed: number;
        errors: number;
    };
}
export declare const globalRequestQueue: RequestQueue;
export declare const queueRequests: (options?: {
    priority?: string;
    queueTimeout?: number;
}) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=requestBatching.d.ts.map