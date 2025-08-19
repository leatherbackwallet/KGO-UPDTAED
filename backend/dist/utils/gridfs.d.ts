import mongoose from 'mongoose';
import { Readable } from 'stream';
export declare function initializeGridFS(): void;
export declare function uploadImage(file: Express.Multer.File, filename?: string): Promise<{
    fileId: mongoose.Types.ObjectId;
    filename: string;
    contentType: string;
    size: number;
}>;
export declare function getImageStream(fileId: string | mongoose.Types.ObjectId): Readable;
export declare function deleteImage(fileId: string | mongoose.Types.ObjectId): Promise<void>;
export declare function getImageMetadata(fileId: string | mongoose.Types.ObjectId): Promise<{
    _id: mongoose.Types.ObjectId;
    filename: string;
    contentType: string;
    length: number;
    uploadDate: Date;
    metadata?: any;
} | null>;
export declare function listImages(): Promise<Array<{
    _id: mongoose.Types.ObjectId;
    filename: string;
    contentType: string;
    length: number;
    uploadDate: Date;
    metadata?: any;
}>>;
export declare function imageExists(fileId: string | mongoose.Types.ObjectId): Promise<boolean>;
//# sourceMappingURL=gridfs.d.ts.map