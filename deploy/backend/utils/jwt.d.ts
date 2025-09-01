export interface JWTPayload {
    id: string;
    email: string;
    roleId: string;
    firstName: string;
    lastName: string;
    type: 'access' | 'refresh';
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
}
export declare const generateSecureToken: (length?: number) => string;
export declare const generateTokenPair: (payload: Omit<JWTPayload, "type">) => TokenPair;
export declare const verifyAccessToken: (token: string) => JWTPayload | null;
export declare const verifyRefreshToken: (token: string) => JWTPayload | null;
export declare const refreshAccessToken: (refreshToken: string) => TokenPair | null;
export declare const decodeToken: (token: string) => any;
//# sourceMappingURL=jwt.d.ts.map