import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { authMiddleware, checkCredits } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/smilecam';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueId = uuidv4();
    cb(null, `${uniqueId}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Capture and process image
router.post('/capture', authMiddleware, checkCredits, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const inputPath = req.file.path;
    const outputDir = 'uploads/smilecam/processed';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFileName = `processed-${uuidv4()}.jpg`;
    const outputPath = path.join(outputDir, outputFileName);

    // Process the image with sharp (resize, enhance, etc.)
    await sharp(inputPath)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    // Clean up the original uploaded file
    fs.unlinkSync(inputPath);

    // For now, return a simple response
    // In a real implementation, you would integrate with a facial recognition API
    res.json({
      success: true,
      message: 'Image captured and processed successfully',
      imageUrl: `/uploads/smilecam/processed/${outputFileName}`,
      // Mock facial expression detection
      expressions: {
        smile: Math.random() > 0.5 ? 'detected' : 'not detected',
        confidence: Math.floor(Math.random() * 100)
      }
    });

  } catch (error) {
    console.error('SmileCam processing error:', error);
    res.status(500).json({ error: 'Image processing failed', details: error.message });
  }
});

// Get processed image
router.get('/image/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join('uploads/smilecam/processed', filename);
    
    if (fs.existsSync(imagePath)) {
      res.sendFile(path.resolve(imagePath));
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Image retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
});

export default router; 