export interface ChunkMetadata {
  originalFileName: string;
  totalChunks: number;
  currentChunk: number;
  chunkSize: number;
  totalSize: number;
}
