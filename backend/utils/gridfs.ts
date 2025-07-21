/**
 * GridFS Utility - Handles image storage and retrieval using MongoDB GridFS
 * This provides a scalable solution for storing product images directly in the database
 */

import mongoose from 'mongoose';
import { GridFSBucket, GridFSFile } from 'mongodb';
import { Readable } from 'stream';

// GridFS bucket for storing images
let bucket: GridFSBucket;

/**
 * Initialize GridFS bucket
 */
export function initializeGridFS(): void {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB connection not established');
  }
  
  bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'product-images'
  });
}

/**
 * Upload image to GridFS
 * @param file - Multer file object
 * @param filename - Custom filename (optional)
 * @returns Promise with file ID and metadata
 */
export async function uploadImage(file: Express.Multer.File, filename?: string): Promise<{
  fileId: mongoose.Types.ObjectId;
  filename: string;
  contentType: string;
  size: number;
}> {
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
    const readableStream = new Readable();
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

/**
 * Get image stream from GridFS
 * @param fileId - GridFS file ID
 * @returns Readable stream of the image
 */
export function getImageStream(fileId: string | mongoose.Types.ObjectId): Readable {
  if (!bucket) {
    throw new Error('GridFS not initialized');
  }

  return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
}

/**
 * Delete image from GridFS
 * @param fileId - GridFS file ID
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteImage(fileId: string | mongoose.Types.ObjectId): Promise<void> {
  if (!bucket) {
    throw new Error('GridFS not initialized');
  }

  await bucket.delete(new mongoose.Types.ObjectId(fileId));
}

/**
 * Get image metadata from GridFS
 * @param fileId - GridFS file ID
 * @returns Promise with file metadata
 */
export async function getImageMetadata(fileId: string | mongoose.Types.ObjectId): Promise<{
  _id: mongoose.Types.ObjectId;
  filename: string;
  contentType: string;
  length: number;
  uploadDate: Date;
  metadata?: any;
} | null> {
  if (!bucket) {
    throw new Error('GridFS not initialized');
  }

  const files = bucket.find({ _id: new mongoose.Types.ObjectId(fileId) });
  const fileArray = await files.toArray();
  
  if (fileArray.length === 0) {
    return null;
  }
  
  const file = fileArray[0] as GridFSFile;
  return {
    _id: file._id,
    filename: file.filename,
    contentType: file.contentType || 'application/octet-stream',
    length: file.length,
    uploadDate: file.uploadDate,
    metadata: file.metadata
  };
}

/**
 * List all images in GridFS
 * @returns Promise with array of file metadata
 */
export async function listImages(): Promise<Array<{
  _id: mongoose.Types.ObjectId;
  filename: string;
  contentType: string;
  length: number;
  uploadDate: Date;
  metadata?: any;
}>> {
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

/**
 * Check if image exists in GridFS
 * @param fileId - GridFS file ID
 * @returns Promise that resolves to true if image exists
 */
export async function imageExists(fileId: string | mongoose.Types.ObjectId): Promise<boolean> {
  try {
    const metadata = await getImageMetadata(fileId);
    return metadata !== null;
  } catch (error) {
    return false;
  }
} 