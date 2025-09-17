import { Request, Response, NextFunction } from 'express';
interface LoggedRequest extends Request {
    body: any;
}
interface LoggedResponse extends Response {
    json: (data: any) => this;
}
export declare const logger: (req: LoggedRequest, res: LoggedResponse, next: NextFunction) => void;
export declare const errorLogger: (err: Error, req: LoggedRequest, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=logger.d.ts.map