import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import PaymentModal from './PaymentModal';

const SmileCam = () => {
  // --- State Management ---
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState(null);
  const [cameraMode, setCameraMode] = useState('user');
  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [modalStep, setModalStep] = useState(1);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isSmileDetected, setIsSmileDetected] = useState(false);
  const [autoCaptureMode, setAutoCaptureMode] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // --- Refs ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const viewportRef = useRef(null);

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

  // --- Core Functions (defined with useCallback) ---

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    setStream(null);
    setIsActive(false);
    setIsSmileDetected(false);
  }, []);

  const startCamera = useCallback(async (mode) => {
    if (streamRef.current) {
      stopCamera();
    }
    setCameraError('');
    const currentCameraMode = mode || cameraMode;
    const constraints = { 
      video: { 
        facingMode: currentCameraMode, 
        width: { ideal: 1280 }, 
        height: { ideal: 720 } 
      } 
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);

      // Check if torch is supported
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      if (capabilities.torch) {
        setTorchSupported(true);
        // Reapply torch state if it was enabled
        if (torchEnabled) {
          try {
            await videoTrack.applyConstraints({
              advanced: [{ torch: true }]
            });
          } catch (err) {
            console.error('Error reapplying torch:', err);
          }
        }
      } else {
        setTorchSupported(false);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Failed to access camera. Please check permissions.');
    }
  }, [cameraMode, stopCamera, torchEnabled]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);
    setProcessingResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      setCapturedImage(blob);
      setIsCapturing(false);
      stopCamera();
    }, 'image/jpeg', 0.9);
  }, [isCapturing, stopCamera]);

  const processFinalImage = useCallback(async (imageBlob) => {
    if (!modelsLoaded) return { success: false, error: "AI Models not loaded." };

    try {
      const image = await faceapi.bufferToImage(imageBlob);

      const detections = await faceapi
        .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections) {
        const smileValue = detections.expressions.happy > 0.7 ? 'Yes' : 'No';
        const confidenceValue = (detections.expressions.happy * 100).toFixed(0);
        return {
          success: true,
          expressions: { smile: smileValue, confidence: confidenceValue },
        };
      } else {
        return { success: false, error: 'Could not detect a face in the image.' };
      }
    } catch (error) {
      console.error('Error in processFinalImage:', error);
      return { success: false, error: 'Failed to analyze the image.' };
    }
  }, [modelsLoaded]);

  const processImage = useCallback(async () => {
    if (!capturedImage) return;
    setIsProcessing(true);

    const analysisResult = await processFinalImage(capturedImage);
    
    setProcessingResult(analysisResult);

    const token = localStorage.getItem('token');
    if (token && analysisResult.success) {
      try {
        await axios.post(`${API_BASE_URL}/tools/deduct-credits`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        window.dispatchEvent(new Event('authChange'));
      } catch (error) {
        console.error("Credit deduction failed:", error);
      }
    }

    setIsProcessing(false);
  }, [capturedImage, processFinalImage, API_BASE_URL]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setProcessingResult(null);
    startCamera();
  }, [startCamera]);

  const downloadImage = useCallback(() => {
    if (!capturedImage) return;
    const url = URL.createObjectURL(capturedImage);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smilecam_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [capturedImage]);

  const switchCamera = useCallback(() => {
    const newMode = cameraMode === 'user' ? 'environment' : 'user';
    setCameraMode(newMode);
    startCamera(newMode);
  }, [cameraMode, startCamera]);
  
  const toggleAutoCapture = () => setAutoCaptureMode(prev => !prev);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupported) return;

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const newTorchState = !torchEnabled;
      
      await videoTrack.applyConstraints({
        advanced: [{ torch: newTorchState }]
      });
      
      setTorchEnabled(newTorchState);
    } catch (error) {
      console.error('Error toggling torch:', error);
      setCameraError('Failed to toggle flashlight.');
      setTimeout(() => setCameraError(''), 3000);
    }
  }, [torchEnabled, torchSupported]);

  const toggleFullscreen = useCallback(() => {
    if (!viewportRef.current) return;

    if (!document.fullscreenElement) {
      viewportRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  const handleDeviceSelect = useCallback((device) => {
    if (device === 'mobile') {
      setModalStep(2);
    } else {
      setShowModal(false);
      startCamera('user');
    }
  }, [startCamera]);

  const handleCameraSelect = useCallback((mode) => {
    setShowModal(false);
    startCamera(mode);
  }, [startCamera]);

  const handlePaymentSuccess = () => setIsPaymentModalOpen(false);

  // --- useEffect Hooks ---

  useEffect(() => {
    const checkMobile = () => /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
    setIsMobile(checkMobile());

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Failed to load face-api models:", error);
        setCameraError("Could not load AI models. Please refresh.");
      }
    };
    loadModels();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (isActive && modelsLoaded && autoCaptureMode) {
      detectionIntervalRef.current = setInterval(async () => {
        if (videoRef.current && !videoRef.current.paused) {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

          const smile = detections[0]?.expressions.happy > 0.8;
          setIsSmileDetected(smile);
          if (smile) {
            handleCapture();
          }
        }
      }, 700);
    } else {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    }
    return () => clearInterval(detectionIntervalRef.current);
  }, [isActive, modelsLoaded, autoCaptureMode, handleCapture]);


  return (
    <div className="smile-cam">
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
      {showModal && (
        <div className="smile-cam__intro-overlay">
          <div className="smile-cam__intro">
            {modalStep === 1 ? (
              <>
                <h2 className="smile-cam__intro-title">Welcome to SmileCam</h2>
                <p className="smile-cam__intro-text">Please confirm your device type:</p>
                <div className="smile-cam__intro-actions">
                  <button className="smile-cam__intro-btn" onClick={() => handleDeviceSelect('laptop')}>💻 Laptop / PC</button>
                  <button className="smile-cam__intro-btn" onClick={() => handleDeviceSelect('mobile')}>📱 Mobile</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="smile-cam__intro-title">Choose Camera</h2>
                <p className="smile-cam__intro-text">Which camera would you like to use?</p>
                <div className="smile-cam__intro-actions">
                  <button className="smile-cam__intro-btn" onClick={() => handleCameraSelect('user')}>🤳 Front</button>
                  <button className="smile-cam__intro-btn" onClick={() => handleCameraSelect('environment')}>📷 Back</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="smile-cam__shell">
        <div className="smile-cam__subtitle">AI-powered camera that captures photos when you smile.</div>
        <div className="smile-cam__stage">
          <div className={`smile-cam__viewport ${isFullscreen ? 'smile-cam__viewport--fullscreen' : ''}`} ref={viewportRef}>
            {cameraError && <div className="smile-cam__error">{cameraError}</div>}
            <video ref={videoRef} autoPlay playsInline muted className={`smile-cam__video ${!capturedImage && isActive ? 'smile-cam__video--visible' : ''}`} />
            {capturedImage && <img src={URL.createObjectURL(capturedImage)} alt="Captured" className="smile-cam__capture smile-cam__capture--visible" />}
            {!isActive && !capturedImage && (
              <div className="smile-cam__placeholder">{!modelsLoaded ? 'Loading AI Models...' : 'Start camera to begin'}</div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {isProcessing && <div className="smile-cam__processing"><span>Processing...</span></div>}
            {isActive && (
              <div className="smile-cam__indicator">
                <span className={`smile-cam__dot ${isSmileDetected ? 'smile-cam__dot--active' : ''}`}></span>
                {autoCaptureMode ? (isSmileDetected ? 'Smile!' : 'Detecting...') : 'Ready'}
              </div>
            )}
            {isFullscreen && processingResult && (
              <div className={`smile-cam__analysis smile-cam__analysis--fullscreen ${processingResult.success ? 'smile-cam__analysis--success' : 'smile-cam__analysis--error'}`}>
                {processingResult.success ? (
                  <>
                    <p>Smile Detected: {processingResult.expressions.smile}</p>
                    <p>Confidence: {processingResult.expressions.confidence}%</p>
                  </>
                ) : (
                  <p>{processingResult.error}</p>
                )}
              </div>
            )}
            {isFullscreen && (
              <div className="smile-cam__controls smile-cam__controls--fullscreen">
                {!isActive && !capturedImage && (
                  <button className="smile-cam__btn smile-cam__btn--start" onClick={() => startCamera(cameraMode)} disabled={!modelsLoaded}>
                    {modelsLoaded ? 'Start Camera' : 'Loading Models...'}
                  </button>
                )}
                {isActive && (
                  <div className="smile-cam__live">
                    <button className="smile-cam__btn" onClick={handleCapture} disabled={isCapturing}>📸 Capture</button>
                    {isMobile && <button className="smile-cam__btn" onClick={switchCamera}>🔄 Switch</button>}
                    <button 
                      className={`smile-cam__btn smile-cam__btn--torch ${torchEnabled ? 'smile-cam__btn--torch-on' : ''}`} 
                      onClick={toggleTorch}
                      disabled={!torchSupported}
                      title={!torchSupported ? 'Flashlight not supported on this camera' : (torchEnabled ? 'Turn off flashlight' : 'Turn on flashlight')}
                    >
                      {torchEnabled ? '🔦' : '💡'} {torchEnabled ? 'On' : 'Off'}
                    </button>
                    <button className={`smile-cam__btn ${autoCaptureMode ? 'smile-cam__btn--active' : ''}`} onClick={toggleAutoCapture}>🤖 Auto</button>
                    <button className="smile-cam__btn" onClick={toggleFullscreen}>🗗 Exit Fullscreen</button>
                    <button className="smile-cam__btn smile-cam__btn--stop" onClick={stopCamera}>⏹️ Stop</button>
                  </div>
                )}
                {capturedImage && (
                  <div className="smile-cam__captured">
                    <button className="smile-cam__btn" onClick={retakePhoto}>🔄 Retake</button>
                    <button className="smile-cam__btn smile-cam__btn--process" onClick={processImage} disabled={isProcessing}>🔍 Analyze</button>
                    <button className="smile-cam__btn" onClick={downloadImage}>💾 Download</button>
                  </div>
                )}
              </div>
            )}
          </div>
          {!isFullscreen && processingResult && (
            <div className={`smile-cam__analysis ${processingResult.success ? 'smile-cam__analysis--success' : 'smile-cam__analysis--error'}`}>
              {processingResult.success ? (
                <>
                  <p>Smile Detected: {processingResult.expressions.smile}</p>
                  <p>Confidence: {processingResult.expressions.confidence}%</p>
                </>
              ) : (
                <p>{processingResult.error}</p>
              )}
            </div>
          )}
          {!isFullscreen && (
            <div className="smile-cam__controls">
              {!isActive && !capturedImage && (
                <button className="smile-cam__btn smile-cam__btn--start" onClick={() => startCamera(cameraMode)} disabled={!modelsLoaded}>
                  {modelsLoaded ? 'Start Camera' : 'Loading Models...'}
                </button>
              )}
              {isActive && (
                <div className="smile-cam__live">
                  <button className="smile-cam__btn" onClick={handleCapture} disabled={isCapturing}>📸 Capture</button>
                  {isMobile && <button className="smile-cam__btn" onClick={switchCamera}>🔄 Switch</button>}
                  <button 
                    className={`smile-cam__btn smile-cam__btn--torch ${torchEnabled ? 'smile-cam__btn--torch-on' : ''}`} 
                    onClick={toggleTorch}
                    disabled={!torchSupported}
                    title={!torchSupported ? 'Flashlight not supported on this camera' : (torchEnabled ? 'Turn off flashlight' : 'Turn on flashlight')}
                  >
                    {torchEnabled ? '🔦' : '💡'} {torchEnabled ? 'On' : 'Off'}
                  </button>
                  <button className={`smile-cam__btn ${autoCaptureMode ? 'smile-cam__btn--active' : ''}`} onClick={toggleAutoCapture}>🤖 Auto</button>
                  <button className="smile-cam__btn" onClick={toggleFullscreen}>
                    {isFullscreen ? '🗗 Exit Fullscreen' : '⛶ Fullscreen'}
                  </button>
                  <button className="smile-cam__btn smile-cam__btn--stop" onClick={stopCamera}>⏹️ Stop</button>
                </div>
              )}
              {capturedImage && (
                <div className="smile-cam__captured">
                  <button className="smile-cam__btn" onClick={retakePhoto}>🔄 Retake</button>
                  <button className="smile-cam__btn smile-cam__btn--process" onClick={processImage} disabled={isProcessing}>🔍 Analyze</button>
                  <button className="smile-cam__btn" onClick={downloadImage}>💾 Download</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmileCam;