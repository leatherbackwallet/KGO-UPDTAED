import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';
interface CacheOptions {
    enableETag?: boolean;
    cacheControl?: string;
    staleWhileRevalidate?: boolean;
}
interface WarmingConfig {
    products?: boolean;
    categories?: boolean;
}
interface CacheStats {
    keys: number;
    hits: number;
    misses: number;
    keyspace: string[];
}
declare const cache: NodeCache;
declare const generateETag: (data: any) => string;
export declare const createCacheMiddleware: (ttl?: number, keyGenerator?: ((req: Request) => string) | null, options?: CacheOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const cacheConfigs: {
    products: (req: Request, res: Response, next: NextFunction) => void;
    product: (req: Request, res: Response, next: NextFunction) => void;
    categories: (req: Request, res: Response, next: NextFunction) => void;
    profile: (req: Request, res: Response, next: NextFunction) => void;
    static: (req: Request, res: Response, next: NextFunction) => void;
};
export declare const invalidateCache: (pattern: string) => void;
export declare const invalidateProductCache: () => void;
export declare const invalidateCategoryCache: () => void;
export declare const invalidateUserCache: (userId: string) => void;
export declare const getCacheStats: () => CacheStats;
export declare const clearCache: () => void;
export declare const warmCache: (warmingConfig: WarmingConfig) => Promise<void>;
export declare const scheduleWarmCache: () => void;
export { cache, generateETag };
//# sourceMappingURL=cache.d.ts.map