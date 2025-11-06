import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { authMiddleware, checkCredits } from '../middleware/auth.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Use youtube-dl-exec wrapper for cross-platform yt-dlp execution
const youtubedl = require('youtube-dl-exec');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// SECTION 1: CONFIGURATION & SETUP
// Directory paths
const UPLOADS_DIR = path.join('uploads', 'audio');
const OUTPUT_DIR = path.join(UPLOADS_DIR, 'output');
[UPLOADS_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Note: we prefer youtube-dl-exec wrapper instead of hardcoding a binary path (works on Linux/Windows)

// ytdl-core agent for better reliability
const ytdlAgent = ytdl.createAgent(undefined, { localAddress: undefined });

// Auto-cleanup: Delete ytdl-core debug files on startup and periodically
const cleanupDebugFiles = () => {
  const backendDir = path.join(__dirname, '..');
  try {
    fs.readdirSync(backendDir).forEach(file => {
      if (file.match(/^\d+-player-script\.js$/)) {
        try {
          fs.unlinkSync(path.join(backendDir, file));
        } catch (e) { /* file may already be deleted */ }
      }
    });
  } catch (err) { /* ignore */ }
};

// Clean on startup
cleanupDebugFiles();

// Clean periodically (every 30 seconds) instead of watching This prevents nodemon restart loops
setInterval(cleanupDebugFiles, 30000);

// Multer configuration for video file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'];
    cb(null, allowedTypes.includes(file.mimetype));
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// SECTION 2: HELPER FUNCTIONS
// Format seconds to H:MM:SS or M:SS
const formatDuration = (seconds = 0) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hrs > 0 
    ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format view count (1.5M, 10.2K, etc.)
const formatViews = (views = 0) => {
  const v = Number(views) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${v}`;
};

// Remove invalid filename characters
const safeFileName = (name = 'file') => 
  name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim() || 'file';

// Promise timeout helper
const withTimeout = (promise, ms, message = 'Operation timed out') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
};

// Lightweight fallback preview via YouTube oEmbed (no API key, limited fields)
const fetchOEmbedPreview = async (videoUrl) => {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
  const resp = await fetch(oembedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!resp.ok) throw new Error(`oEmbed request failed: ${resp.status}`);
  const data = await resp.json();
  return {
    title: data.title,
    channel: data.author_name,
    duration: '',
    views: '',
    thumbnail: data.thumbnail_url,
    description: '',
    uploadDate: '',
    videoId: ''
  };
};

// Download audio using yt-dlp (primary method)
const downloadWithYtDlp = async (url, outputPath, format) => {
  try {
    const opts = {
      extractAudio: true,
      audioFormat: format,
      audioQuality: '0',
      output: outputPath,
      noWarnings: true,
      format: 'bestaudio/best',
      noPlaylist: true,
      maxFilesize: '100M'
    };
    // Wrap with timeout similar to 120s
    await withTimeout(youtubedl(url, opts), 120000, 'yt-dlp timed out');
    return fs.existsSync(outputPath);
  } catch (_) {
    return false;
  }
};

// Download audio using ytdl-core + ffmpeg (fallback method)
const downloadWithYtdlCore = async (url, outputPath, format) => {
  const audioStream = ytdl(url, {
    quality: 'highestaudio',
    filter: 'audioonly',
    agent: ytdlAgent,
    requestOptions: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }
  });

  const audioCodec = format === 'mp3' ? 'libmp3lame' : format === 'wav' ? 'pcm_s16le' : 'flac';
  const audioBitrate = format === 'mp3' ? '192k' : format === 'wav' ? '1411k' : '320k';

  return new Promise((resolve, reject) => {
    ffmpeg(audioStream)
      .audioCodec(audioCodec)
      .audioBitrate(audioBitrate)
      .format(format)
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });
};

// SECTION 3: API ENDPOINTS
// POST /youtube - Convert YouTube video to audio
router.post('/youtube', authMiddleware, checkCredits, async (req, res) => {
  try {
    const rawUrl = req.body.url;
    const url = decodeURIComponent(Array.isArray(rawUrl) ? rawUrl[0] : (rawUrl || ''));
    const format = (req.body.format || 'mp3').toLowerCase();
    if (!url) return res.status(400).json({ error: 'YouTube URL is required' });
    if (!/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Try to fetch metadata, but don't fail conversion if it errors
    let videoTitle = 'youtube_audio';
    try {
      const ytdlInfo = await withTimeout(ytdl.getInfo(url, {
        agent: ytdlAgent,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        }
      }), 6000, 'YouTube info fetch timed out');
      const vd = ytdlInfo.videoDetails;
      videoTitle = safeFileName(vd.title || `youtube_${vd.videoId}`);
    } catch (_) {
      // try minimal oEmbed for title
      try {
        const preview = await withTimeout(fetchOEmbedPreview(url), 4000);
        videoTitle = safeFileName(preview.title || videoTitle);
      } catch (_) { /* keep default title */ }
    }
    const outputFileName = `${uuidv4()}-${videoTitle}.${format}`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    // Try yt-dlp first, fallback to ytdl-core if it fails
    let success = await downloadWithYtDlp(url, outputPath, format);
    
    if (!success) {
      await downloadWithYtdlCore(url, outputPath, format);
    }

    return res.json({
      success: true,
      message: 'Audio converted successfully',
      downloadUrl: `/api/audio/download/${path.basename(outputPath)}`,
      filename: `${videoTitle}.${format}`,
      format
    });
  } catch (err) {
    // User-friendly error messages
    let message = 'Unable to convert this video. Please try a different video or format.';
    if (err.message?.includes('403')) {
      message = 'This video is currently unavailable for download. Please try again later.';
    } else if (err.message?.includes('private') || err.message?.includes('unavailable')) {
      message = 'This video is private or unavailable. Please check the URL.';
    }

    return res.status(503).json({
      error: 'Audio conversion failed',
      message,
      suggestion: 'Try a different YouTube video URL or try again in a few moments.'
    });
  }
});

// GET /youtube/preview - Get YouTube video metadata
router.get('/youtube/preview', async (req, res) => {
  try {
    const rawUrl = req.query.url;
    const url = decodeURIComponent(Array.isArray(rawUrl) ? rawUrl[0] : (rawUrl || ''));
    if (!url) return res.status(400).json({ error: 'YouTube URL is required' });
    if (!/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // First try ytdl-core with a short timeout; fall back to oEmbed on failure
    const info = await withTimeout(ytdl.getInfo(url, {
      agent: ytdlAgent,
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    }), 6000, 'YouTube info fetch timed out');

    const vd = info.videoDetails;
    return res.json({
      title: vd.title,
      channel: vd.author?.name || 'Unknown Channel',
      duration: formatDuration(parseInt(vd.lengthSeconds || 0)),
      views: formatViews(parseInt(vd.viewCount || 0)),
      thumbnail: vd.thumbnails?.[vd.thumbnails.length - 1]?.url || null,
      description: (vd.description || '').substring(0, 200) + '...',
      uploadDate: vd.uploadDate || '',
      videoId: vd.videoId || ''
    });
  } catch (err) {
    // Fallback: oEmbed minimal metadata
    try {
      const rawUrl = req.query.url;
      const url = decodeURIComponent(Array.isArray(rawUrl) ? rawUrl[0] : (rawUrl || ''));
      const preview = await withTimeout(fetchOEmbedPreview(url), 4000, 'oEmbed timed out');
      return res.json({ ...preview, fallback: 'oembed' });
    } catch (fallbackErr) {
      return res.status(503).json({
        error: 'YouTube preview temporarily unavailable',
        message: 'Unable to fetch video information (ytdl/oEmbed both failed).',
        details: err?.message || undefined,
        suggestions: ['Try a different YouTube video', 'Ensure the URL is correct']
      });
    }
  }
});

// POST /video - Convert uploaded video file to audio
router.post('/video', authMiddleware, checkCredits, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });

    const { format = 'mp3' } = req.body;
    const inputPath = req.file.path;
    const outputFileName = `${uuidv4()}-${path.parse(req.file.originalname).name}.${format}`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    const audioCodec = format === 'mp3' ? 'libmp3lame' : format === 'wav' ? 'pcm_s16le' : 'flac';
    const audioBitrate = format === 'mp3' ? '192k' : format === 'wav' ? '1411k' : '320k';

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec(audioCodec)
        .audioBitrate(audioBitrate)
        .format(format)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // Cleanup input file
    try { fs.unlinkSync(inputPath); } catch (e) { /* ignore */ }

    // Send file and cleanup after download
    return res.download(outputPath, outputFileName, (err) => {
      setTimeout(() => {
        try { fs.unlinkSync(outputPath); } catch (e) { /* ignore */ }
      }, 5000);
    });
  } catch (err) {
    return res.status(500).json({ error: 'Video conversion failed', details: err.message });
  }
});

// GET /download/:filename - Download converted audio file
router.get('/download/:filename', (req, res) => {
  const filePath = path.join(OUTPUT_DIR, req.params.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  return res.download(filePath, req.params.filename, () => {
    setTimeout(() => {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }, 5000);
  });
});

export default router;