export class FileUploader {
  private readonly file: File;
  private readonly chunkSize: number;
  private readonly totalChunks: number;
  private uploadedChunks: Set<number>;
  private activeUploads: number;
  private readonly maxConcurrentUploads: number;

  constructor(file: File, chunkSize: number = 5 * 1024 * 1024, maxConcurrentUploads: number = 3) {
    this.file = file;
    this.chunkSize = chunkSize;
    this.totalChunks = Math.ceil(file.size / chunkSize);
    this.uploadedChunks = new Set();
    this.activeUploads = 0;
    this.maxConcurrentUploads = maxConcurrentUploads;
  }

  async uploadFile(): Promise<void> {
    const uploadPromises: Promise<void>[] = [];

    for (let i = 0; i < this.totalChunks; i++) {
      if (this.activeUploads >= this.maxConcurrentUploads) {
        await Promise.race(uploadPromises);
      }

      const uploadPromise = this.uploadChunk(i).finally(() => {
        this.activeUploads--;
      });

      uploadPromises.push(uploadPromise);
      this.activeUploads++;
    }

    await Promise.all(uploadPromises);
  }

  private async uploadChunk(chunkIndex: number): Promise<void> {
    const start = chunkIndex * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.file.size);
    const chunk = this.file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('metadata', JSON.stringify({
      originalFileName: this.file.name,
      totalChunks: this.totalChunks,
      currentChunk: chunkIndex,
      chunkSize: this.chunkSize,
      totalSize: this.file.size
    }));

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload chunk ${chunkIndex}`);
    }

    const result = await response.json();
    this.uploadedChunks.add(chunkIndex);

    return result;
  }

  getProgress(): number {
    return (this.uploadedChunks.size / this.totalChunks) * 100;
  }
}
