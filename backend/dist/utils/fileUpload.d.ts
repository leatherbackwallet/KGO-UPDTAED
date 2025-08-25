export declare function ensureProductImagesDir(): void;
export declare function uploadImage(file: Express.Multer.File, customName?: string): Promise<{
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
}>;
export declare function deleteImage(filename: string): Promise<void>;
export declare function imageExists(filename: string): Promise<boolean>;
export declare function listImages(): Promise<string[]>;
export declare function getImageMetadata(filename: string): Promise<{
    filename: string;
    size: number;
    mimetype: string;
    created: Date;
} | null>;
export declare function cleanupOrphanedImages(referencedImages: string[]): Promise<number>;
//# sourceMappingURL=fileUpload.d.ts.map