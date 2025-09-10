import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare function uploadImageToCloudinary(file: Express.Multer.File, options?: {
    folder?: string;
    transformation?: any[];
    public_id?: string;
}): Promise<{
    public_id: string;
    url: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
    size: number;
}>;
export declare function deleteImageFromCloudinary(public_id: string): Promise<any>;
export declare function getOptimizedImageUrl(public_id: string, options?: {
    width?: number | undefined;
    height?: number | undefined;
    crop?: string | undefined;
    quality?: string | undefined;
    format?: string | undefined;
}): string;
export declare function getImageMetadata(public_id: string): Promise<any>;
export declare function listImages(folder?: string, options?: {
    max_results?: number;
    next_cursor?: string;
}): Promise<any>;
export declare function verifyImageExists(public_id: string, maxRetries?: number): Promise<{
    exists: boolean;
    accessible: boolean;
    error?: string;
}>;
export default cloudinary;
//# sourceMappingURL=cloudinary.d.ts.map