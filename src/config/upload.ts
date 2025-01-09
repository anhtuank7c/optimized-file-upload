import path from 'path';

export const UPLOAD_CONFIG = {
  TEMP_DIR: path.join(__dirname, '../temp'),
  UPLOAD_DIR: path.join(__dirname, '../uploads'),
  MAX_CHUNK_SIZE: 5 * 1024 * 1024, // 5MB per chunk
  MAX_PARALLEL_UPLOADS: 3, // Limit parallel uploads based on server capacity
};
