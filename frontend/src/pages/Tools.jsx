import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

// Component Imports
import AudioConverter from '../components/AudioConverter';
import FileConverter from '../components/FileConverter';
import SmileCam from '../components/SmileCam';
import ImageGenerator from '../components/ImageGenerator';
import ImageResizer from '../components/ImageResizer';
import ToolCard from '../components/ToolCard';
import { assets } from '../assets/assets';
import AINumberPredictor from '../components/AINumberPredictor';

// --- Production Enhancement: Data Separation ---
// Moved tool data outside the component to prevent re-declaration on every render.
// In a larger app, this would typically be in its own file (e.g., `data/tools.js`).
const toolData = [
    {
        id: 'audio-converter',
        title: 'Audio Converter',
        description: 'Convert YouTube videos or local files to MP3, WAV, FLAC',
    icon: assets.webDataGif,
        component: AudioConverter,
        available: true
    },
    {
        id: 'file-converter',
        title: 'File Converter',
        description: 'Convert PDF to DOC/DOCX and vice versa',
    icon: assets.convertGif,
        component: FileConverter,
        available: true
    },
    {
        id: 'smilecam',
        title: 'Smile-Cam',
        description: 'Real-time camera capture with facial detection',
    icon: assets.cuteCameraGif,
        component: SmileCam,
        available: true
    },
    {
        id: 'image-resizer',
        title: 'Image Resizer',
        description: 'Resize, crop, and convert images with precision',
    icon: assets.resizeGif,
        component: ImageResizer,
        available: true
    },
    {
        id: 'image-generator',
        title: 'AI Image Generator',
        description: 'Generate images from text prompts using Stability AI',
    icon: assets.aiImageGif,
        component: ImageGenerator,
        available: true
    },
    {
        id: 'ai-number-predictor',
        title: 'AI Number Predictor',
        description: 'Let our advanced AI predict your secret number (0-99)!',
    icon: assets.aiGif,
        component: AINumberPredictor,
        available: true
    },
    // Example of a future tool
    {
        id: 'video-editor',
        title: 'Video Editor',
        description: 'Advanced video editing with AI-powered features',
        icon: assets.videditGif,
        available: false,
        progress: '30%',
        eta: '2028',
    },
    {
        id: 'voice-cloner',
        title: 'Voice Cloner',
        description: 'Clone and modify voices using advanced AI technology',
        icon: assets.voiceGif,
        available: false,
        progress: '20%',
        eta: '2026',
    },
    {
        id: 'code-generator',
        title: 'Code Generator',
        description: 'Generate code from natural language descriptions using AI assistance',
        icon: assets.codeGif,
        available: false,
        progress: '10%',
        eta: '2027',
    },
];

// --- Production Enhancement: Componentization ---
// Breaking the UI into smaller, focused components improves readability and maintainability.

// Component to display the list of all tools
const ToolListView = ({ tools, onToolClick }) => (
    <>
        <div className="tools-page__header">
            <h1 className="tools-page__title">Available Tools</h1>
            <p className="tools-page__subtitle">Discover our collection of powerful tools designed to make your digital tasks easier and more efficient.</p>
        </div>
        <div className="tools-page__grid">
            {tools.map((tool) => (
                <ToolCard
                    key={tool.id}
                    tool={tool}
                    onClick={() => onToolClick(tool)}
                />
            ))}
        </div>
    </>
);

// Component to display the selected tool
const SelectedToolView = ({ tool, onBackClick }) => {
    // Memoize the component to prevent re-creating it on every render
    const ToolComponent = useMemo(() => tool.component, [tool]);

    return (
        <>
            {/* --- Layout Fix: Header structure updated --- */}
            <div className="tools-page__tool-header">
                <button className="tools-page__back" onClick={onBackClick}>
                    Back to Tools
                </button>
                <h1 className="tools-page__header-title">{tool.title}</h1>
            </div>
            <div className="tools-page__component">
                <ToolComponent />
            </div>
        </>
    );
};


const Tools = () => {
    const navigate = useNavigate();
    const { toolId } = useParams();
    const location = useLocation();
    const [selectedTool, setSelectedTool] = useState(null);

    // Effect to handle URL-based tool selection
    useEffect(() => {
        if (toolId) {
            const tool = toolData.find(t => t.id === toolId);
            if (tool && tool.available) {
                setSelectedTool(tool);
            } else {
                // If tool not found or not available, redirect to tools page
                navigate('/tools');
            }
        } else {
            setSelectedTool(null);
        }
    }, [toolId, navigate]);

    // Handle tool selection
    const handleToolClick = useCallback((tool) => {
        if (tool.available) {
            navigate(`/tools/${tool.id}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [navigate]);

    // Handle back button
    const handleBackClick = useCallback(() => {
        navigate('/tools');
    }, [navigate]);

    return (
        <div className="tools-page">
            {selectedTool ? (
                <SelectedToolView tool={selectedTool} onBackClick={handleBackClick} />
            ) : (
                <ToolListView tools={toolData} onToolClick={handleToolClick} />
            )}
        </div>
    );
};

export default Tools;
