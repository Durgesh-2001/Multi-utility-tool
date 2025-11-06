import React, { useState, useRef } from 'react';
import PaymentModal from './PaymentModal';

const ImageResizer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resizeMode, setResizeMode] = useState('percentage');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [percentage, setPercentage] = useState(50);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [outputFormat, setOutputFormat] = useState('jpeg');
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState(null);
  const [error, setError] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      
      // Get original dimensions
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        if (resizeMode === 'percentage') {
          setWidth(Math.round(img.width * (percentage / 100)));
          setHeight(Math.round(img.height * (percentage / 100)));
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleWidthChange = (newWidth) => {
    setWidth(newWidth);
    if (maintainAspectRatio && originalDimensions) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      setHeight(Math.round(newWidth / aspectRatio));
    }
  };

  const handleHeightChange = (newHeight) => {
    setHeight(newHeight);
    if (maintainAspectRatio && originalDimensions) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };

  const handlePercentageChange = (newPercentage) => {
    setPercentage(newPercentage);
    if (originalDimensions) {
      setWidth(Math.round(originalDimensions.width * (newPercentage / 100)));
      setHeight(Math.round(originalDimensions.height * (newPercentage / 100)));
    }
  };

  const resizeImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to use this feature');
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // First, try to deduct credits
      try {
        const deductResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tools/deduct-credits`, {
          method: 'POST',
          headers
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

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        
        // Draw the resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          setDownloadUrl(url);
          setIsProcessing(false);
        }, `image/${outputFormat}`, quality / 100);
      };
      
      img.src = preview;
    } catch (error) {
      let errorMessage = 'Error resizing image. Please try again.';
      if (error.response && error.response.status === 402) {
        setIsPaymentModalOpen(true);
        errorMessage = 'You have insufficient credits or your free quota is over. Please upgrade your plan to continue.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    resizeImage();
  };

  const downloadImage = () => {
    if (!downloadUrl) return;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `resized_${selectedFile.name.split('.')[0]}.${outputFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setDownloadUrl(null);
    setOriginalDimensions(null);
    setWidth(800);
    setHeight(600);
    setPercentage(50);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-res">
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
      {error && (
        <div style={{ background: '#ffeaea', color: '#b91c1c', padding: '1rem', borderRadius: 8, marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>
          {error}
        </div>
      )}
      <div className="image-res__header">
        <p>Resize, crop, and convert your images with precision and ease</p>
      </div>
      <div className="image-res__body">
        <div className="image-res__upload">
          <div 
            className="image-res__drop"
            ref={dropZoneRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="image-res__drop-content">
              <div className="image-res__icon">📁</div>
              <h3>Drop your image here</h3>
              <p>or click to browse</p>
              <span className="image-res__formats">Supports: JPG, PNG, GIF, WebP</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {selectedFile && (
          <div className="image-res__work">
            <div className="image-res__previews">
              <div className="image-res__preview image-res__preview--original">
                <h4>Original ({originalDimensions?.width} × {originalDimensions?.height})</h4>
                <img src={preview} alt="Original" />
              </div>
              {downloadUrl && (
                <div className="image-res__preview image-res__preview--resized">
                  <h4>Resized ({width} × {height})</h4>
                  <img src={downloadUrl} alt="Resized" />
                </div>
              )}
            </div>
            <div className="image-res__controls">
              <div className="image-res__group">
                <label>Resize Mode:</label>
                <div className="image-res__modes">
                  <button
                    className={`image-res__mode-btn ${resizeMode === 'percentage' ? 'image-res__mode-btn--active' : ''}`}
                    onClick={() => setResizeMode('percentage')}
                  >
                    Percentage
                  </button>
                  <button
                    className={`image-res__mode-btn ${resizeMode === 'dimensions' ? 'image-res__mode-btn--active' : ''}`}
                    onClick={() => setResizeMode('dimensions')}
                  >
                    Dimensions
                  </button>
                </div>
              </div>
              {resizeMode === 'percentage' ? (
                <div className="image-res__group">
                  <label>Scale: {percentage}%</label>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={percentage}
                    onChange={(e) => handlePercentageChange(parseInt(e.target.value))}
                  />
                  <div className="image-res__range-labels">
                    <span>1%</span>
                    <span>100%</span>
                    <span>200%</span>
                  </div>
                </div>
              ) : (
                <div className="image-res__dims">
                  <div className="image-res__group">
                    <label>Width (px):</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                      min="1"
                      max="5000"
                    />
                  </div>
                  <div className="image-res__group">
                    <label>Height (px):</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                      min="1"
                      max="5000"
                    />
                  </div>
                  <div className="image-res__group">
                    <label>
                      <input
                        type="checkbox"
                        checked={maintainAspectRatio}
                        onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      />
                      Maintain Aspect Ratio
                    </label>
                  </div>
                </div>
              )}

              <div className="image-res__output">
                <div className="image-res__group">
                  <label>Output Format:</label>
                  <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>
                <div className="image-res__group">
                  <label>Quality: {quality}%</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="image-res__actions">
                <button
                  className="image-res__btn image-res__btn--primary"
                  onClick={resizeImage}
                  disabled={isProcessing}
                >
                  {isProcessing ? '🔄 Processing...' : '✨ Resize Image'}
                </button>
                {downloadUrl && (
                  <button className="image-res__btn image-res__btn--accent" onClick={downloadImage}>
                    💾 Download
                  </button>
                )}
                <button className="image-res__btn image-res__btn--reset" onClick={resetForm}>
                  🔄 Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageResizer; 