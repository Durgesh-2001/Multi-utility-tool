# multi-tool.io

One platform. Smarter tools. Simpler life.

[![Live Demo — Try Now](https://img.shields.io/badge/Live%20Demo-Try%20Now-brightgreen?style=for-the-badge&logo=vercel)](https://multi-tool-io.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4+-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

> Your digital Swiss Army knife for creators, students, and anyone who loves simpler workflows.

- Live Demo: https://multi-tool-io.vercel.app
- Env setup: see [backend/ENV_SETUP.md](backend/ENV_SETUP.md)

---

## Table of Contents

- Overview
- Features
- Available Tools
- Tech Stack
- Architecture
- Project Structure
- Getting Started (Windows-friendly)
- Deployment
- Environment Variables
- Tool Details
- Contributing
- License
- Support

---

## Overview

multi-tool.io is a full-stack web platform bundling a suite of practical, fast, and secure tools into one cohesive experience. It’s optimized for speed (Vite + React), built with a clean modular backend (Express + MongoDB), and designed to look great in both light and dark themes.

---

## Features

- 🌙 Dark/Light Theme with consistent styling across components
- 📊 Progress indicators and responsive feedback
- 🔄 Auto-save and recovery for safer workflows
- 🧭 URL-based, persistent navigation per tool
- 🔐 Secure auth with JWT; optional Google OAuth
- ⚡ Performance-optimized frontend (Vite) and modular backend

---

## Available Tools

- 🎵 Audio Converter: Extract and convert audio (e.g., YouTube/video ➜ MP3/WAV/FLAC)
- 📄 File Converter: PDF ↔ DOC/DOCX, preserving layout and styling
- 📸 SmileCam: Real-time camera with automatic smile detection and capture
- 🖼️ Image Resizer: Resize, crop, and optimize images
- 🎨 AI Image Generator: Text ➜ image via Stability AI (SDXL)
- 🔮 AI Number Predictor: Neural-network-style predictor with visual feedback
- 🔒 Password Reset: Multi-channel (email/SMS) with secure tokens
- 💸 Payments: Razorpay integration for premium features

Planned (high level): 🎬 Video Editor, 🎤 Voice Cloner, 💻 Code Generator, 📊 Data Analyzer

---

## Tech Stack

- Frontend: React 18, Vite, CSS (theme via CSS variables), React Router
- Backend: Node.js, Express.js, MongoDB + Mongoose
- Auth & Security: JWT, bcrypt, Google OAuth (optional)
- Communications: Nodemailer (email), Twilio (SMS), Ethereal (dev email)
- AI/ML: Stability AI (SDXL); OpenAI (future features)

---

## Architecture

Monorepo with `frontend/` (React + Vite) and `backend/` (Express + MongoDB).

- Modular tool system: each tool has a dedicated route/controller under `backend/routes` and `backend/controllers`
- Shared utilities in `backend/utils/` (e.g., email service)
- Auth middleware in `backend/middleware/auth.js`
- Uploads stored under `backend/uploads/` with per-tool subfolders
- Frontend uses React Router and a theme system via CSS variables

See `.github/copilot-instructions.md` for more architectural notes.

---

## Project Structure

```
NEW Multi-tool.io/
├── backend/
│   ├── controllers/           # Business logic (payments, user, tools)
│   ├── routes/                # API routes per tool (audio, imagegen, etc.)
│   ├── models/                # Mongoose models
│   ├── middleware/            # Auth and other middleware
│   ├── utils/                 # Shared utilities (emailService, etc.)
│   ├── uploads/               # User uploads (audio, images)
│   ├── server.js              # Express app entry
│   └── package.json
├── frontend/
│   ├── src/                   # React app (components, pages, hooks, context)
│   ├── public/                # Static assets (face models, etc.)
│   └── package.json
├── LICENSE
└── README.md
```

---

## Getting Started (Windows-friendly)

Prerequisites:
- Node.js 18+
- npm (or yarn/pnpm)
- MongoDB (local or cloud)

1) Clone the repo

```powershell
git clone https://github.com/your-username/multi-tool.io.git
cd multi-tool.io
```

2) Backend setup

```powershell
cd backend
npm install
# Copy the template and add your secrets (PowerShell)
Copy-Item ENV_SETUP.md .env
# Edit .env with the required variables (see backend/ENV_SETUP.md for details)
npm start
```

3) Frontend setup

```powershell
cd ../frontend
npm install
npm run dev
```

4) Open the app

Visit http://localhost:5173

Notes:
- If ports are in use, adjust the Vite dev server port in `frontend/vite.config.js` or `npm run dev -- --port 5174`.
- Ensure your backend `.env` is configured before using tools that hit the API.

---

## Deployment

Deploy to Vercel (recommended):
1. Fork this repository
2. Connect your GitHub to Vercel and import the repo
3. Configure environment variables for the backend (see [backend/ENV_SETUP.md](backend/ENV_SETUP.md))
4. Deploy and verify your live URL

Other options: Netlify (frontend), Railway/Render/Heroku/DigitalOcean (full stack)

---

## Environment Variables

Never commit your `.env`.

- Backend variables are listed in [backend/ENV_SETUP.md](backend/ENV_SETUP.md) (JWT secrets, email/Twilio credentials, Stability AI keys, MongoDB URL, etc.)
- For dev email, Ethereal is supported; for SMS, Twilio is used

---

## Tool Details

### 📸 SmileCam
- Automatic smile detection and optional auto-capture
- Front/rear camera switching on supported devices
- Real-time visual status indicators

### 🔮 AI Number Predictor
- Neural-network-style simulation with visuals and confidence indicators
- Interactive interface with subtle animations

### 🎨 AI Image Generator
- SDXL-based text-to-image generation via Stability AI
- Multiple dimensions and style options

### 🎵 Audio Converter
- Extract audio from videos and YouTube
- Convert to MP3/WAV/FLAC with quality options

### 📄 File Converter
- Fast PDF ↔ DOC/DOCX with formatting preservation

---

## Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m "Add amazing feature"`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

Guidelines:
- Follow the existing style and structure
- Add tests where meaningful
- Update docs for any user-facing changes

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Support

- Issues: use GitHub Issues for bugs/requests
- Discussions: community Q&A and ideas
- For business inquiries: open an issue or reach out via project profile

> "The best way to predict the future is to invent it." — Alan Kay

— multi-tool.io 🚀