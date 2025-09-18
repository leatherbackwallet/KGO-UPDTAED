import { Request, Response } from 'express';

declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
      [key: string]: any;
    };
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}

export interface ApiResponse<T = any> extends Response {
  json(body: { success: boolean; data?: T; error?: { message: string; code?: string } }): this;
} 