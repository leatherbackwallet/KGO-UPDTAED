import { Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
        [key: string]: any;
      };
    }
  }
}

// Re-export Request and Response for convenience
export { Request, Response }; 