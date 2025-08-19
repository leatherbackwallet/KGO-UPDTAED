"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGridFS = initializeGridFS;
exports.uploadImage = uploadImage;
exports.getImageStream = getImageStream;
exports.deleteImage = deleteImage;
exports.getImageMetadata = getImageMetadata;
exports.listImages = listImages;
exports.imageExists = imageExists;
const mongoose_1 = __importDefault(require("mongoose"));
const stream_1 = require("stream");
let bucket;
function initializeGridFS() {
    if (!mongoose_1.default.connection.db) {
        throw new Error('MongoDB connection not established');
    }
    bucket = new mongoose_1.default.mongo.GridFSBucket(mongoose_1.default.connection.db, {
        bucketName: 'product-images'
    });
}
async function uploadImage(file, filename) {
    if (!bucket) {
        throw new Error('GridFS not initialized');
    }
    const uploadStream = bucket.openUploadStream(filename || file.originalname, {
        contentType: file.mimetype,
        metadata: {
            originalName: file.originalname,
            uploadedAt: new Date()
        }
    });
    return new Promise((resolve, reject) => {
        const readableStream = new stream_1.Readable();
        readableStream.push(file.buffer);
        readableStream.push(null);
        readableStream
            .pipe(uploadStream)
            .on('error', reject)
            .on('finish', () => {
            resolve({
                fileId: uploadStream.id,
                filename: uploadStream.filename,
                contentType: uploadStream.options.contentType || file.mimetype,
                size: file.size
            });
        });
    });
}
function getImageStream(fileId) {
    if (!bucket) {
        throw new Error('GridFS not initialized');
    }
    return bucket.openDownloadStream(new mongoose_1.default.Types.ObjectId(fileId));
}
async function deleteImage(fileId) {
    if (!bucket) {
        throw new Error('GridFS not initialized');
    }
    await bucket.delete(new mongoose_1.default.Types.ObjectId(fileId));
}
async function getImageMetadata(fileId) {
    if (!bucket) {
        throw new Error('GridFS not initialized');
    }
    const files = bucket.find({ _id: new mongoose_1.default.Types.ObjectId(fileId) });
    const fileArray = await files.toArray();
    if (fileArray.length === 0) {
        return null;
    }
    const file = fileArray[0];
    return {
        _id: file._id,
        filename: file.filename,
        contentType: file.contentType || 'application/octet-stream',
        length: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata
    };
}
async function listImages() {
    if (!bucket) {
        throw new Error('GridFS not initialized');
    }
    const files = bucket.find({});
    const fileArray = await files.toArray();
    return fileArray.map(file => ({
        _id: file._id,
        filename: file.filename,
        contentType: file.contentType || 'application/octet-stream',
        length: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata
    }));
}
async function imageExists(fileId) {
    try {
        const metadata = await getImageMetadata(fileId);
        return metadata !== null;
    }
    catch (error) {
        return false;
    }
}
//# sourceMappingURL=gridfs.js.map