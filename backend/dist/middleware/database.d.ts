import { Request, Response, NextFunction } from 'express';
export declare function ensureDatabaseConnection(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function optionalDatabaseConnection(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=database.d.ts.map