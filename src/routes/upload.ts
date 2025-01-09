import express from 'express';
import multer from 'multer';
import { FileManager } from '../utils/fileManager';
import { UPLOAD_CONFIG } from '../config/upload';
import { ChunkMetadata } from '../domain/entities/chunk-metadata';

const router = express.Router();
const upload = multer({ dest: UPLOAD_CONFIG.TEMP_DIR });

router.post('/upload', upload.single('chunk'), async (req, res) => {
  try {
    const metadata: ChunkMetadata = JSON.parse(req.body.metadata);
    const fileManager = FileManager.getInstance();

    if (metadata.currentChunk === 0) {
      await fileManager.initializeUpload(metadata.originalFileName, metadata.totalChunks);
    }

    const isComplete = await fileManager.saveChunk(req.file.buffer, metadata);

    res.json({
      success: true,
      isComplete,
      message: isComplete ? 'Upload completed' : 'Chunk received'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing upload'
    });
  }
});

export default router;