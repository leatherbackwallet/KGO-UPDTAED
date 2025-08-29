import { Request } from 'express';

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