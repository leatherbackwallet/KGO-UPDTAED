import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const registerSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}, {
    phone: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const productSchema: z.ZodObject<{
    name: z.ZodObject<{
        en: z.ZodString;
        ml: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        en: string;
        ml: string;
    }, {
        en: string;
        ml: string;
    }>;
    description: z.ZodObject<{
        en: z.ZodString;
        ml: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        en: string;
        ml: string;
    }, {
        en: string;
        ml: string;
    }>;
    price: z.ZodNumber;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    stock: z.ZodOptional<z.ZodNumber>;
    occasions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isFeatured: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: {
        en: string;
        ml: string;
    };
    description: {
        en: string;
        ml: string;
    };
    price: number;
    categories?: string[] | undefined;
    stock?: number | undefined;
    occasions?: string[] | undefined;
    isFeatured?: boolean | undefined;
}, {
    name: {
        en: string;
        ml: string;
    };
    description: {
        en: string;
        ml: string;
    };
    price: number;
    categories?: string[] | undefined;
    stock?: number | undefined;
    occasions?: string[] | undefined;
    isFeatured?: boolean | undefined;
}>;
export declare const validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const schemas: {
    register: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        phone: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        phone: string;
        firstName: string;
        lastName: string;
        email: string;
        password: string;
    }, {
        phone: string;
        firstName: string;
        lastName: string;
        email: string;
        password: string;
    }>;
    login: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
    refresh: z.ZodObject<{
        refreshToken: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        refreshToken: string;
    }, {
        refreshToken: string;
    }>;
    product: z.ZodObject<{
        name: z.ZodObject<{
            en: z.ZodString;
            ml: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            en: string;
            ml: string;
        }, {
            en: string;
            ml: string;
        }>;
        description: z.ZodObject<{
            en: z.ZodString;
            ml: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            en: string;
            ml: string;
        }, {
            en: string;
            ml: string;
        }>;
        price: z.ZodNumber;
        categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        stock: z.ZodOptional<z.ZodNumber>;
        occasions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        isFeatured: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: {
            en: string;
            ml: string;
        };
        description: {
            en: string;
            ml: string;
        };
        price: number;
        categories?: string[] | undefined;
        stock?: number | undefined;
        occasions?: string[] | undefined;
        isFeatured?: boolean | undefined;
    }, {
        name: {
            en: string;
            ml: string;
        };
        description: {
            en: string;
            ml: string;
        };
        price: number;
        categories?: string[] | undefined;
        stock?: number | undefined;
        occasions?: string[] | undefined;
        isFeatured?: boolean | undefined;
    }>;
};
//# sourceMappingURL=validation.d.ts.map