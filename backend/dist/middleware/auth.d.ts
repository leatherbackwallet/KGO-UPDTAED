import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
}
export declare const auth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=auth.d.ts.map