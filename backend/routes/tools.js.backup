import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { deductCredits } from '../controllers/userController.js';

const router = express.Router();

router.post('/deduct-credits', authMiddleware, deductCredits);

router.get('/', (req, res) => {
  try {
    const tools = Object.values(TOOLS_DATABASE);
    res.json({
      success: true,
      tools: tools,
      total: tools.length,
      available: tools.filter(t => t.available).length,
      comingSoon: tools.filter(t => !t.available).length
    });
  } catch (error) {
    console.error('Error getting tools:', error);
    res.status(500).json({ error: 'Failed to get tools' });
  }
});

// Get specific tool by ID
router.get('/:toolId', (req, res) => {
  try {
    const { toolId } = req.params;
    const tool = TOOLS_DATABASE[toolId];
    
    if (!tool) {
      return res.status(404).json({ 
        error: 'Tool not found',
        message: 'The requested tool does not exist'
      });
    }
    
    res.json({
      success: true,
      tool: tool
    });
  } catch (error) {
    console.error('Error getting tool:', error);
    res.status(500).json({ error: 'Failed to get tool details' });
  }
});

// Get tools by category
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const tools = Object.values(TOOLS_DATABASE).filter(tool => tool.category === category);
    
    res.json({
      success: true,
      tools: tools,
      category: category,
      total: tools.length
    });
  } catch (error) {
    console.error('Error getting tools by category:', error);
    res.status(500).json({ error: 'Failed to get tools by category' });
  }
});

// Get coming soon tools
router.get('/status/coming-soon', (req, res) => {
  try {
    const comingSoonTools = Object.values(TOOLS_DATABASE).filter(tool => !tool.available);
    
    res.json({
      success: true,
      tools: comingSoonTools,
      total: comingSoonTools.length
    });
  } catch (error) {
    console.error('Error getting coming soon tools:', error);
    res.status(500).json({ error: 'Failed to get coming soon tools' });
  }
});

// Get available tools
router.get('/status/available', (req, res) => {
  try {
    const availableTools = Object.values(TOOLS_DATABASE).filter(tool => tool.available);
    
    res.json({
      success: true,
      tools: availableTools,
      total: availableTools.length
    });
  } catch (error) {
    console.error('Error getting available tools:', error);
    res.status(500).json({ error: 'Failed to get available tools' });
  }
});

// Get tool statistics
router.get('/stats/overview', (req, res) => {
  try {
    const tools = Object.values(TOOLS_DATABASE);
    const categories = [...new Set(tools.map(t => t.category))];
    const difficulties = [...new Set(tools.map(t => t.difficulty))];
    
    const stats = {
      total: tools.length,
      available: tools.filter(t => t.available).length,
      comingSoon: tools.filter(t => !t.available).length,
      categories: categories.length,
      difficulties: difficulties,
      averageProgress: tools.filter(t => !t.available).reduce((acc, t) => {
        const progress = parseInt(t.progress) || 0;
        return acc + progress;
      }, 0) / tools.filter(t => !t.available).length || 0
    };
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting tool stats:', error);
    res.status(500).json({ error: 'Failed to get tool statistics' });
  }
});

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