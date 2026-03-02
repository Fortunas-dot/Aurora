/**
 * MongoDB GridFS Storage Service
 * 
 * Stores uploaded files directly in MongoDB using GridFS.
 * This ensures files persist across Railway deploys (unlike the ephemeral filesystem).
 * 
 * GridFS splits files into 255KB chunks, so there's no 16MB document size limit.
 * This supports all file types: images, videos, audio.
 */

import mongoose from 'mongoose';
import fs from 'fs';
import { Readable } from 'stream';

let bucket: mongoose.mongo.GridFSBucket | null = null;

function getBucket(): mongoose.mongo.GridFSBucket {
  if (!bucket) {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB not connected - cannot access GridFS');
    }
    bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
  }
  return bucket;
}

// Reset bucket reference when connection changes
mongoose.connection.on('disconnected', () => {
  bucket = null;
});

/**
 * Store a file in MongoDB GridFS
 * @param localFilePath Path to the local file (from multer)
 * @param filename The filename to store under (e.g., "file-1234567890-123.jpg")
 * @param contentType MIME type of the file
 */
export async function storeFile(localFilePath: string, filename: string, contentType: string): Promise<void> {
  const gridBucket = getBucket();
  
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(localFilePath);
    const uploadStream = gridBucket.openUploadStream(filename, {
      contentType,
      metadata: {
        originalPath: localFilePath,
        uploadedAt: new Date(),
      },
    });

    readStream
      .pipe(uploadStream)
      .on('error', (err) => {
        console.error(`❌ GridFS upload error for ${filename}:`, err);
        reject(err);
      })
      .on('finish', () => {
        console.log(`✅ Stored in MongoDB GridFS: ${filename} (${contentType})`);
        resolve();
      });
  });
}

/**
 * Store a file from a Buffer in MongoDB GridFS
 */
export async function storeBuffer(buffer: Buffer, filename: string, contentType: string): Promise<void> {
  const gridBucket = getBucket();
  
  return new Promise((resolve, reject) => {
    const readStream = new Readable();
    readStream.push(buffer);
    readStream.push(null);
    
    const uploadStream = gridBucket.openUploadStream(filename, {
      contentType,
      metadata: {
        uploadedAt: new Date(),
      },
    });

    readStream
      .pipe(uploadStream)
      .on('error', reject)
      .on('finish', resolve);
  });
}

/**
 * Get file metadata from MongoDB GridFS (without opening a stream)
 * @param filename The filename to look up
 * @returns File info or null if not found
 */
export async function getFileInfo(filename: string): Promise<{
  contentType: string;
  length: number;
} | null> {
  const gridBucket = getBucket();
  const files = await gridBucket.find({ filename }).toArray();
  if (files.length === 0) return null;
  const file = files[files.length - 1];
  return {
    contentType: file.contentType || 'application/octet-stream',
    length: file.length,
  };
}

/**
 * Get a file from MongoDB GridFS
 * @param filename The filename to retrieve
 * @param start Optional byte offset to start reading from (for Range requests)
 * @param end Optional byte offset to stop reading at (for Range requests)
 * @returns Object with download stream and file info, or null if not found
 */
export async function getFile(filename: string, start?: number, end?: number): Promise<{
  stream: mongoose.mongo.GridFSBucketReadStream;
  contentType: string;
  length: number;
} | null> {
  const gridBucket = getBucket();
  
  // Find the file metadata
  const files = await gridBucket.find({ filename }).toArray();
  if (files.length === 0) {
    return null;
  }
  
  const file = files[files.length - 1]; // Get the latest version
  
  // Support byte-range streaming (required for video playback on iOS/Android)
  const streamOptions: any = {};
  if (start !== undefined) {
    streamOptions.start = start;
  }
  if (end !== undefined) {
    streamOptions.end = end + 1; // GridFS end is exclusive
  }
  
  const stream = gridBucket.openDownloadStreamByName(filename, streamOptions);
  
  return {
    stream,
    contentType: file.contentType || 'application/octet-stream',
    length: file.length,
  };
}

/**
 * Check if a file exists in MongoDB GridFS
 */
export async function fileExists(filename: string): Promise<boolean> {
  const gridBucket = getBucket();
  const files = await gridBucket.find({ filename }).toArray();
  return files.length > 0;
}

/**
 * Delete a file from MongoDB GridFS
 */
export async function deleteFile(filename: string): Promise<void> {
  const gridBucket = getBucket();
  const files = await gridBucket.find({ filename }).toArray();
  
  for (const file of files) {
    await gridBucket.delete(file._id);
  }
}
