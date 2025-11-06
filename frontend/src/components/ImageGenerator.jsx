import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentModal from './PaymentModal';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOption, setSelectedOption] = useState('placeholder');
  const [availableOptions, setAvailableOptions] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

  const samplePrompts = [
    'A serene mountain landscape at sunset with golden clouds',
    'A futuristic city with flying cars and neon lights',
    'A cute robot playing with a cat in a garden',
    'A magical forest with glowing mushrooms and fairy lights',
    'A steampunk airship flying over Victorian London',
    'A peaceful beach scene with palm trees and crystal clear water'
  ];

  // Set available options on component mount
  useEffect(() => {
    // Define default options
    setAvailableOptions([
      {
        id: 'stability-ai',
        name: 'Stability AI',
        description: 'High-quality AI image generation',
        type: 'ai',
      },
      {
        id: 'placeholder',
        name: 'Placeholder Generator',
        description: 'Generate test images',
        type: 'placeholder',
      }
    ]);
    setSelectedOption('stability-ai');
    setIsLoadingOptions(false);
  }, []);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    setError('');
    setSuccess('');
  };

  const handleSamplePrompt = (samplePrompt) => {
    setPrompt(samplePrompt);
    setError('');
    setSuccess('');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate an image');
      return;
    }

    if (prompt.length < 10) {
      setError('Please provide a more detailed description (at least 10 characters)');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');
    setGeneratedImage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to use this feature');
      }

      // First, try to deduct credits
      try {
        const deductResponse = await fetch(`${API_BASE_URL}/tools/deduct-credits`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!deductResponse.ok) {
          const errorData = await deductResponse.json();
          if (deductResponse.status === 403) {
            setIsPaymentModalOpen(true);
          }
          throw new Error(errorData.message || 'Failed to process credits');
        }

        // Trigger UI update for credits
        window.dispatchEvent(new Event('authChange'));
      } catch (deductError) {
        throw new Error(deductError.message || 'Failed to process credits. Please try again.');
      }

      const response = await axios.post(`${API_BASE_URL}/imagegen/generate`, {
        prompt: prompt.trim(),
        option: selectedOption
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000 // 60 seconds timeout for AI generation
      });

      if (response.data.success) {
        setGeneratedImage(response.data.imageUrl);
        setSuccess(response.data.message);
        window.dispatchEvent(new Event('authChange'));
      } else {
        setError(response.data.error || 'Failed to generate image');
      }
    } catch (err) {
      let errorMessage = 'Failed to generate image';
      if (err.response) {
        if (err.response.status === 402) {
          setIsPaymentModalOpen(true);
          errorMessage = 'You have insufficient credits or your free quota is over. Please upgrade your plan to continue.';
        } else if (err.response.data) {
          const errorData = err.response.data;
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. The image generation is taking longer than expected.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    handleGenerate(); // Retry generation after successful payment
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    try {
      const link = document.createElement('a');
      link.href = `${import.meta.env.VITE_BACKEND_URL}${generatedImage}`;
      const extension = generatedImage.endsWith('.png') ? 'png' : 'jpg';
      link.download = `generated_image_${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download image. Please try right-clicking on the image and selecting "Save image as".');
    }
  };

  const clearAll = () => {
    setPrompt('');
    setGeneratedImage(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="image-gen">
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
      <div className="image-gen__panel">
        <p className="image-gen__subtitle">
          Transform your ideas into stunning images using advanced AI technology.
          Powered by Stability AI for high-quality image generation.
        </p>

        <div className="image-gen__inputs">
          <div className="image-gen__prompt">
            <label className="image-gen__prompt-label" htmlFor="prompt">Describe the image you want to generate:</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={handlePromptChange}
              placeholder="Enter a detailed description of the image you want to create... (e.g., 'A majestic dragon flying over a medieval castle at sunset with golden clouds')"
              disabled={isGenerating}
              rows="4"
              className="image-gen__textarea"
            />
          </div>

          <div className="image-gen__option">
            <label className="image-gen__option-label" htmlFor="option">Generation Method:</label>
            {isLoadingOptions ? (
              <div className="image-gen__loading">Loading options...</div>
            ) : (
              <select
                id="option"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                disabled={isGenerating}
                className="image-gen__select"
              >
                {availableOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name} - {option.description}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="image-gen__samples">
            <h4 className="image-gen__samples-title">💡 Sample Prompts:</h4>
            <div className="image-gen__sample-grid">
              {samplePrompts.map((samplePrompt, index) => (
                <button
                  key={index}
                  className="image-gen__sample-btn"
                  onClick={() => handleSamplePrompt(samplePrompt)}
                  disabled={isGenerating}
                >
                  {samplePrompt}
                </button>
              ))}
            </div>
          </div>
          <div className="image-gen__actions">
            <button
              className="image-gen__btn image-gen__btn--generate"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : '✨ Generate Image'}
            </button>
            <button
              className="image-gen__btn image-gen__btn--clear"
              onClick={clearAll}
              disabled={isGenerating}
            >
              Clear
            </button>
          </div>
        </div>
        {isGenerating && (
          <div className="image-gen__progress">
            <div className="image-gen__spinner" />
            <p className="image-gen__progress-text">Creating your masterpiece with AI...</p>
            <p className="image-gen__progress-hint">This may take up to a minute. Please wait.</p>
          </div>
        )}

        {error && !isGenerating && (
          <div className="image-gen__alert image-gen__alert--error">❌ {error}</div>
        )}
        {success && !isGenerating && (
          <div className="image-gen__alert image-gen__alert--success">✅ {success}</div>
        )}

        {generatedImage && (
          <div className="image-gen__result">
            <h3 className="image-gen__result-title">Generated Image:</h3>
            <div className="image-gen__image-wrap">
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${generatedImage}`}
                alt="Generated"
                className="image-gen__image"
                onError={() => setError('Failed to load generated image. Please try regenerating.')}
              />
            </div>
            <div className="image-gen__result-actions">
              <button className="image-gen__result-btn image-gen__result-btn--download" onClick={downloadImage}>💾 Download</button>
              <button className="image-gen__result-btn image-gen__result-btn--regen" onClick={handleGenerate}>🔄 Regenerate</button>
            </div>
          </div>
        )}
      </div>

      <div className="image-gen__info">
        <div className="image-gen__tips">
          <h4 className="image-gen__tips-title">💡 Tips for better results:</h4>
          <ul>
            <li>Be specific and detailed in your descriptions</li>
            <li>Include style keywords (realistic, artistic, cartoon, etc.)</li>
            <li>Mention lighting, colors, and mood</li>
            <li>Specify camera angles and composition</li>
            <li>Use descriptive adjectives and vivid language</li>
            <li>Consider using artistic references (oil painting, digital art, etc.)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator; 