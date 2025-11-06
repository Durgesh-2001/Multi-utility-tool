import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { deductCredits } from '../controllers/userController.js';

const router = express.Router();

// Minimal in-file tools DB to avoid undefined references
const TOOLS = {
  audio: { id: 'audio', name: 'Audio Tools', category: 'media', available: true },
  imagegen: { id: 'imagegen', name: 'AI Image Gen', category: 'ai', available: true },
  file: { id: 'file', name: 'File Converter', category: 'utility', available: true },
};

router.post('/deduct-credits', authMiddleware, deductCredits);

router.get('/', (req, res) => {
  const tools = Object.values(TOOLS);
  res.json({ success: true, tools, total: tools.length });
});

// Get specific tool by ID
router.get('/:toolId', (req, res) => {
  const tool = TOOLS[req.params.toolId];
  if (!tool) return res.status(404).json({ error: 'Tool not found' });
  res.json({ success: true, tool });
});

// Removed category, status, and stats endpoints to reduce code size




// AI Number Prediction Tool (appears authentic)
router.post('/ai-number-predictor', (req, res) => {
  const { guess } = req.body;
  // Accept any integer (positive or negative)
  const userGuess = Number(guess);
  if (typeof guess === 'undefined' || guess === null || guess === '' || isNaN(userGuess) || !/^[-]?\d+$/.test(String(guess))) {
    return res.status(400).json({ error: 'Please enter a valid integer number!' });
  }

  // Enhanced AI jargon steps to match frontend
  const aiThinkingSteps = [
    'Initializing neural network... 🤖',
    'Analyzing user input entropy...',
    'Running deep learning inference...',
    'Activating quantum prediction module...',
    'Cross-referencing with global dataset...',
    'Synthesizing multi-layered results...',
    'Optimizing prediction confidence...',
    'Finalizing output with AI consensus...'
  ];

  // Always return the user's number as the prediction
  // Remove trailing full stop if present in prediction
  const aiResult = `Prediction: ${userGuess} Confidence: 100%`;

  res.json({
    steps: aiThinkingSteps,
    result: aiResult
  });
});

export default router; 