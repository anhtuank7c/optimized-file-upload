import fs from 'fs/promises';
import path from 'path';
import { UPLOAD_CONFIG } from '../config/upload';
import { ChunkMetadata } from '../domain/entities/chunk-metadata';

export class FileManager {
  private static instance: FileManager;
  private activeUploads: Map<string, Set<number>>;
  private completedFiles: Set<string>;

  private constructor() {
    this.activeUploads = new Map();
    this.completedFiles = new Set();
  }

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  async initializeUpload(fileName: string, totalChunks: number): Promise<void> {
    this.activeUploads.set(fileName, new Set());
    await fs.mkdir(UPLOAD_CONFIG.TEMP_DIR, { recursive: true });
    await fs.mkdir(UPLOAD_CONFIG.UPLOAD_DIR, { recursive: true });
  }

  async saveChunk(chunk: Buffer, metadata: ChunkMetadata): Promise<boolean> {
    const { originalFileName, currentChunk } = metadata;
    const chunkPath = path.join(UPLOAD_CONFIG.TEMP_DIR, `${originalFileName}.part${currentChunk}`);

    await fs.writeFile(chunkPath, chunk);

    const uploadTracker = this.activeUploads.get(originalFileName);
    if (uploadTracker) {
      uploadTracker.add(currentChunk);

      if (uploadTracker.size === metadata.totalChunks) {
        await this.mergeChunks(metadata);
        return true;
      }
    }

    return false;
  }

  private async *chunkGenerator(metadata: ChunkMetadata) {
    const { originalFileName, totalChunks } = metadata;

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(UPLOAD_CONFIG.TEMP_DIR, `${originalFileName}.part${i}`);
      const chunk = await fs.readFile(chunkPath);
      yield chunk;
    }
  }

  private async mergeChunks(metadata: ChunkMetadata): Promise<void> {
    const { originalFileName } = metadata;
    const finalPath = path.join(UPLOAD_CONFIG.UPLOAD_DIR, originalFileName);
    const writeStream = fs.createWriteStream(finalPath);

    try {
      for await (const chunk of this.chunkGenerator(metadata)) {
        await new Promise<void>((resolve, reject) => {
          writeStream.write(chunk, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      }

      writeStream.end();

      // Cleanup temp chunks
      for (let i = 0; i < metadata.totalChunks; i++) {
        const chunkPath = path.join(UPLOAD_CONFIG.TEMP_DIR, `${originalFileName}.part${i}`);
        await fs.unlink(chunkPath);
      }

      this.activeUploads.delete(originalFileName);
      this.completedFiles.add(originalFileName);
    } catch (error) {
      console.error('Error merging chunks:', error);
      throw error;
    }
  }

  isUploadComplete(fileName: string): boolean {
    return this.completedFiles.has(fileName);
  }
}
