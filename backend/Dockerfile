# ---- Stage 1: Build environment ----
FROM node:20-slim AS build

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 python3-venv python3-pip \
    pandoc \
    texlive-latex-base texlive-latex-recommended texlive-fonts-recommended texlive-xetex \
    fonts-indic \
    libnss3 libatk1.0-0 libcups2 libgbm1 libasound2 libpangocairo-1.0-0 libxss1 libgtk-3-0 libxshmfence1 libglu1 \
    ffmpeg \
    git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy package.json & package-lock.json
COPY package*.json ./

# Install Node.js dependencies (production only)
RUN npm ci --omit=dev

# ---- Stage 2: Python venv setup ----
# Create a virtual environment for Python packages
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install necessary Python packages
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir pypandoc pdf2docx

# ---- Stage 3: Copy app files ----
COPY . .

# Set NODE_ENV for production
ENV NODE_ENV=production

# Expose backend port
EXPOSE 5000

# Start the backend
CMD ["node", "server.js"]
