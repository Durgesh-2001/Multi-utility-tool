import React, { useState, useRef, useEffect } from 'react';
import { assets } from '../assets/assets';

const VideoPreview = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    // Start playing when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        // console.log('Autoplay prevented:', err);
        setIsPlaying(false);
      });
    }
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoEnd = () => {
    // Restart video when it ends
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  return (
    <div className="video-prev">
      <div className="video-prev__container">
        <div className="video-prev__header">
          <h2 className="video-prev__title">🎬 See It In Action</h2>
        </div>
        
        <div className="video-prev__wrapper">
          <video
            ref={videoRef}
            className="video-prev__video"
            poster="/video-poster.jpg"
            onEnded={handleVideoEnd}
            muted={isMuted}
            loop
            playsInline
            autoPlay
          >
            <source src={assets.preview_video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          <div className="video-prev__controls">
            <button 
              className="video-prev__btn video-prev__btn--play"
              onClick={handlePlayPause}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button 
              className="video-prev__btn video-prev__btn--mute"
              onClick={handleMuteToggle}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
        
        <div className="video-prev__features">
          <div className="video-prev__highlight">
            <span className="video-prev__icon">⚡</span>
            <span>Lightning Fast Conversion</span>
          </div>
          <div className="video-prev__highlight">
            <span className="video-prev__icon">🎯</span>
            <span>Intuitive Interface</span>
          </div>
          <div className="video-prev__highlight">
            <span className="video-prev__icon">🛡️</span>
            <span>Secure Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview; 