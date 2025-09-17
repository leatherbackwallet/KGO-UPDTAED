import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
    };
}
export declare const requireRole: (requiredRole: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=role.d.ts.map