import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createCanvas } from 'canvas';
import { authMiddleware, checkCredits } from '../middleware/auth.js';

const router = express.Router();

// Minimal, focused implementation: placeholder or Stability AI when configured

// Generate placeholder images for testing (completely free, no API needed)
const generatePlaceholderImage = (prompt, width = 512, height = 512) => {
  // Create a canvas for the placeholder image
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Available background colors
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // Fill background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Draw prompt text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Main text (prompt)
  ctx.font = 'bold 24px Arial';
  const displayText = prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;
  ctx.fillText(displayText, width / 2, height / 2);
  
  // Subtitle
  ctx.font = '16px Arial';
  ctx.fillText('Placeholder Image', width / 2, height * 0.7);
  
  // Convert canvas to buffer
  return canvas.toBuffer('image/jpeg', { quality: 0.9 });
};

// Generate image using Stability AI API
const generateWithStabilityAI = async (prompt) => {
  if (!process.env.STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY is not configured');
  }

  const response = await fetch(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 30,
        samples: 1
      }),
      timeout: 30000 // 30 second timeout
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Stability AI API error: ${error.message}`);
  }

  const result = await response.json();
  
  if (!result.artifacts?.[0]?.base64) {
    throw new Error('No image data received from Stability AI');
  }

  return Buffer.from(result.artifacts[0].base64, 'base64');
};

// Generate image: uses Stability AI when configured, otherwise placeholder
router.post('/generate', authMiddleware, checkCredits, async (req, res) => {
  try {
    const { prompt, option } = req.body;
    
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    let imageBuffer, outputFileName;
    const useStability = option === 'stability-ai' && process.env.STABILITY_API_KEY;

    if (useStability) {
      try {
        imageBuffer = await generateWithStabilityAI(prompt);
        outputFileName = `generated-${uuidv4()}.png`;
      } catch (_) {
        imageBuffer = generatePlaceholderImage(prompt);
        outputFileName = `generated-${uuidv4()}.jpg`;
      }
    } else {
      imageBuffer = generatePlaceholderImage(prompt);
      outputFileName = `generated-${uuidv4()}.jpg`;
    }
    
    // Save the generated image locally
    const outputDir = 'uploads/imagegen';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, outputFileName);

    fs.writeFileSync(outputPath, imageBuffer);
    res.json({ success: true, imageUrl: `/uploads/imagegen/${outputFileName}` });

  } catch (error) {
    res.status(500).json({ error: 'Image generation failed' });
  }
});

// Removed /options to keep API minimal

// Get generated image
router.get('/image/:filename', (req, res) => {
  const imagePath = path.join('uploads/imagegen', req.params.filename);
  if (fs.existsSync(imagePath)) return res.sendFile(path.resolve(imagePath));
  return res.status(404).json({ error: 'Image not found' });
});

// Removed setup-local guide

// Removed free-tools listing to reduce code size

export default router; 