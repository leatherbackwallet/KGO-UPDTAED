export declare function migrateSingleImage(localPath: string, filename: string): Promise<{
    success: boolean;
    public_id?: string;
    url?: string;
    error?: string;
}>;
export declare function migrateAllImages(options?: {
    deleteLocalAfterUpload?: boolean;
    updateProductReferences?: boolean;
    batchSize?: number;
}): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{
        filename: string;
        success: boolean;
        public_id?: string;
        url?: string;
        error?: string;
    }>;
}>;
export declare function generateMigrationReport(results: {
    total: number;
    successful: number;
    failed: number;
    results: Array<{
        filename: string;
        success: boolean;
        public_id?: string;
        url?: string;
        error?: string;
    }>;
}): string;
//# sourceMappingURL=migrateToCloudinary.d.ts.map