import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

// Base site title
const BASE_TITLE = 'Multi-tool.io';

// Known tool ID -> Friendly Title map for dynamic routes
const TOOL_TITLE_MAP = {
  'audio-converter': 'Audio Converter',
  'file-converter': 'File Converter',
  'smilecam': 'Smile-Cam',
  'image-resizer': 'Image Resizer',
  'image-generator': 'AI Image Generator',
  'ai-number-predictor': 'AI Number Predictor',
  // Coming soon tools (from data list)
  'video-editor': 'Video Editor',
  'voice-cloner': 'Voice Cloner',
  'code-generator': 'Code Generator',
};

// Fallback: convert slug to Title Case (basic), with a few acronyms normalized
function formatSlug(slug = '') {
  const words = slug
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  const normalized = words.map((w) => {
    const upper = w.toUpperCase();
    if (upper === 'AI') return 'AI';
    if (upper === 'PDF') return 'PDF';
    if (upper === 'DOC') return 'DOC';
    if (upper === 'DOCX') return 'DOCX';
    if (upper === 'MP3') return 'MP3';
    if (upper === 'WAV') return 'WAV';
    if (upper === 'FLAC') return 'FLAC';
    return w;
  });
  return normalized.join(' ');
}

// Route map: path pattern -> title (string or resolver)
const ROUTE_TITLE_MAP = [
  { path: '/', title: '' }, // Home keeps base only
  { path: '/tools', title: 'Tools' },
  {
    path: '/tools/:toolId',
    title: ({ params }) => TOOL_TITLE_MAP[params.toolId] || formatSlug(params.toolId),
  },
  {
    path: '/coming-soon/:toolId',
    title: ({ params }) => `${TOOL_TITLE_MAP[params.toolId] || formatSlug(params.toolId)}`,
  },
  { path: '/pricing', title: 'Pricing' },
  { path: '/profile', title: 'Profile' },
  { path: '/reset', title: 'Reset Password' },
  { path: '/login', title: 'Login' },
  { path: '/register', title: 'Register' },
];

export function useDocumentTitle() {
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;

    for (const route of ROUTE_TITLE_MAP) {
      const match = matchPath({ path: route.path, caseSensitive: false, end: true }, pathname);
      if (match) {
        const resolved = typeof route.title === 'function' ? route.title({ params: match.params, location }) : route.title;
        const suffix = resolved ? ` | ${resolved}` : '';
        document.title = `${BASE_TITLE}${suffix}`;
        return;
      }
    }

    // Default fallback
    document.title = BASE_TITLE;
  }, [location.pathname, location.search, location.hash]);
}

export default useDocumentTitle;
