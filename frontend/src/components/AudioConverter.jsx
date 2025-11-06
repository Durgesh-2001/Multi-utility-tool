import React, { useState, useRef } from 'react';
import axios from 'axios';
import PaymentModal from './PaymentModal';

const AudioConverter = () => {
  const [conversionType, setConversionType] = useState('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [format, setFormat] = useState('mp3');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const fileInputRef = useRef();
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const [vttContent, setVttContent] = useState('');
  const [isVttVisible, setIsVttVisible] = useState(false);

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please select a valid video file');
      }
    }
  };

  const validateYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handlePreview = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }
    if (!validateYouTubeUrl(youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsLoadingPreview(true);
    setError('');
    setVideoInfo(null);

    try {
      const videoId = extractVideoId(youtubeUrl);
      if (!videoId) {
        throw new Error('Could not extract video ID from URL');
      }

      // Get video info from YouTube API or our backend
      const response = await axios.get(`${API_BASE_URL}/audio/youtube/preview`, {
        params: { url: youtubeUrl }
      });

      setVideoInfo(response.data);
    } catch (err) {
      let errorMessage = 'Failed to load video preview';
      
      if (err.response?.data) {
        errorMessage = err.response.data.error || err.response.data.message || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleTypeSwitch = (type) => {
    setConversionType(type);
    setError('');
    setSuccess('');
    setProgress(0);
    setIsConverting(false);
    setVideoInfo(null);
    if (type === 'youtube') {
      setYoutubeUrl('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setSelectedFile(null);
      setYoutubeUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    setProgress(0);
    setError('');
    setSuccess('');

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
        const deductResponse = await fetch(`${API_BASE_URL}/tools/deduct-credits`, {
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

      if (conversionType === 'youtube') {
        if (!youtubeUrl.trim()) {
          throw new Error('Please enter a YouTube URL');
        }
        if (!validateYouTubeUrl(youtubeUrl)) {
          throw new Error('Please enter a valid YouTube URL');
        }

        // Simulate progress for YouTube conversion
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 500);

        try {
          // Get video info to check if conversion is possible
          const response = await axios.post(`${API_BASE_URL}/audio/youtube`, {
            url: youtubeUrl,
            format: format
          }, { headers });

          clearInterval(progressInterval);
          setProgress(100);

          // Download the converted file
          const downloadResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}${response.data.downloadUrl}`, {
            responseType: 'blob'
          });

          // Create download link
          const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', response.data.filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);

          setSuccess('Audio converted and downloaded successfully!');
          setYoutubeUrl('');
          window.dispatchEvent(new Event('authChange'));

        } catch (error) {
          // If the conversion failed, try to get the error message
          if (error.response?.status === 503 || error.response?.status === 500) {
            throw new Error('YouTube conversion service temporarily unavailable. Please try again later.');
          } else if (error.response?.data) {
            throw new Error(error.response.data.error || error.response.data.message || 'YouTube conversion failed');
          }
          throw error;
        }

      } else {
        if (!selectedFile) {
          throw new Error('Please select a video file');
        }

        const formData = new FormData();
        formData.append('video', selectedFile);
        formData.append('format', format);

        // Simulate progress for file upload
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 300);

        const response = await axios.post(`${API_BASE_URL}/audio/video`, formData, {
          responseType: 'blob',
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data'
          }
        });

        clearInterval(progressInterval);
        setProgress(100);

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `converted_${selectedFile.name.replace(/\.[^/.]+$/, '')}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setSuccess('Audio converted and downloaded successfully!');
        setSelectedFile(null);
        window.dispatchEvent(new Event('authChange'));
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      let errorMessage = 'Error uploading file. Please try again.';
      if (err.response) {
        if (err.response.status === 402) {
          setIsPaymentModalOpen(true);
          errorMessage = 'You have insufficient credits or your free quota is over. Please upgrade your plan to continue.';
        } else if (err.response.data) {
          const errorData = err.response.data;
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    handleConvert();
  };

  const clearAll = () => {
    setYoutubeUrl('');
    setSelectedFile(null);
    setSuccess('');
    setVideoInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="audio-conv">
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
      {error && (
        <div className="audio-conv__error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      <div className="audio-conv__shell">
        <div className="audio-conv__types">
          <button
            className={`audio-conv__type-btn ${conversionType === 'youtube' ? 'audio-conv__type-btn--active' : ''}`}
            onClick={() => handleTypeSwitch('youtube')}
          >
            🎥 YouTube URL
          </button>
          <button
            className={`audio-conv__type-btn ${conversionType === 'file' ? 'audio-conv__type-btn--active' : ''}`}
            onClick={() => handleTypeSwitch('file')}
          >
            📁 Local File
          </button>
        </div>
        <div className="audio-conv__section">
          {conversionType === 'youtube' ? (
            <div className="audio-conv__youtube">
              <label htmlFor="youtube-url">YouTube URL:</label>
              <div className="audio-conv__url">
                <input
                  key={conversionType === 'youtube' ? 'youtube-input' : 'file-input'}
                  id="youtube-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl || ''}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={isConverting}
                />
                <button
                  className="audio-conv__preview-btn"
                  onClick={handlePreview}
                  disabled={isConverting || isLoadingPreview || !youtubeUrl.trim()}
                >
                  {isLoadingPreview ? 'Loading...' : '👁️ Preview'}
                </button>
              </div>
              
              {videoInfo && (
                <div className="audio-conv__video-preview">
                  <div className="audio-conv__player">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoInfo.videoId}?rel=0&modestbranding=1`}
                      title={videoInfo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="audio-conv__video-info">
                    <h4 className="audio-conv__video-title">{videoInfo.title}</h4>
                    <p className="audio-conv__video-meta">📺 {videoInfo.channel}</p>
                    <p className="audio-conv__video-meta">⏱️ {videoInfo.duration}</p>
                    <p className="audio-conv__video-meta">👁️ {videoInfo.views} views</p>
                  </div>
                </div>
              )}
              
              <div className="audio-conv__help">
                💡 Note: YouTube conversion may occasionally fail due to YouTube's system updates. 
                If this happens, try a different video or use the local file upload option.
              </div>
            </div>
          ) : (
            <div className="audio-conv__file">
              <label htmlFor="video-file">Select Video File:</label>
              <div
                className="audio-conv__file-drop"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  key={conversionType === 'file' ? 'file-input' : 'youtube-input'}
                  id="video-file"
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  disabled={isConverting}
                />
                <div className="audio-conv__file-icon">🎥</div>
                <div className="audio-conv__file-text">Drop your video file here or click to browse</div>
                <div className="audio-conv__file-hint">Supports MP4, AVI, MOV, MKV, and other video formats</div>
                <div className="audio-conv__file-formats">Max file size: 100MB</div>
              </div>
              {selectedFile && (
                <div className="audio-conv__selected">
                  <div className="audio-conv__file-icon" style={{ fontSize: '2rem' }}>📁</div>
                  <div className="audio-conv__selected-info">
                    <div className="audio-conv__selected-name">{selectedFile.name}</div>
                    <div className="audio-conv__selected-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="audio-conv__format">
          <label htmlFor="format">Output Format:</label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            disabled={isConverting}
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="flac">FLAC</option>
          </select>
        </div>

        {isConverting && (
          <div className="audio-conv__progress">
            <div className="audio-conv__progress-bar">
              <div className="audio-conv__progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="audio-conv__progress-text">Converting... {progress}%</div>
          </div>
        )}
        {success && (<div className="audio-conv__success">✅ {success}</div>)}
        <button
          className="audio-conv__convert-btn"
          onClick={handleConvert}
          disabled={isConverting || (!youtubeUrl && !selectedFile)}
        >
          {isConverting ? 'Converting...' : 'Convert to Audio'}
        </button>
      </div>
    </section>
  );
};

export default AudioConverter; 