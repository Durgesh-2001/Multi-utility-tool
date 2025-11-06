# Backend .env template for multi-tool.io
# Copy this file to .env, then fill in the values.
# PowerShell (Windows):
#   cd backend
#   Copy-Item ENV_SETUP.md .env
#   notepad .env
#
# IMPORTANT: Never commit your .env to git.

# --- Core --------------------------------------------------------------------
# Server port (optional; defaults to 5000)
PORT=5000

# MongoDB connection string
# Examples:
#   Local:  mongodb://127.0.0.1:27017/multitool
#   Atlas:  mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/multitool
MONGODB_URI=mongodb://127.0.0.1:27017/multitool

# Node environment (development or production)
NODE_ENV=development

# --- Authentication -----------------------------------------------------------
# JWT secret used for signing access tokens
# Use a long, random string in production
JWT_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_STRING

# Google OAuth Client ID (optional; needed for Google login)
# Format usually ends with .apps.googleusercontent.com
GOOGLE_CLIENT_ID=

# --- Frontend URL -------------------------------------------------------------
# Used to build password reset links. Backend will prefer VITE_FRONTEND_URL if set.
# For local dev with Vite, the default is usually http://localhost:5173
FRONTEND_URL=http://localhost:5173
VITE_FRONTEND_URL=http://localhost:5173

# --- Email (Nodemailer) -------------------------------------------------------
# In development, if EMAIL_USER is not set, the app will automatically use
# Ethereal (a fake SMTP service) and return a preview URL for testing.
# For production (Gmail example), set EMAIL_USER and EMAIL_PASS (App Password):
#   https://support.google.com/accounts/answer/185833
EMAIL_USER=
EMAIL_PASS=

# --- SMS (Twilio) -------------------------------------------------------------
# If these are not set, OTP flows operate in DEV MODE (no real SMS is sent).
# When configured, messages are sent from TWILIO_PHONE_NUMBER to +91XXXXXXXXXX.
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# --- Payments (Razorpay) ------------------------------------------------------
# Required for live payments. Not needed if you only use the mock payment route.
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# --- AI Integrations ----------------------------------------------------------
# Stability AI API key for SDXL text-to-image. If not set, backend serves
# placeholder images for the Image Generator.
STABILITY_API_KEY=

# --- Notes --------------------------------------------------------------------
# - Email (dev): When using Ethereal, the password reset API returns a previewUrl
#   in development so you can click and view the test email in your browser.
# - Twilio (dev): Without Twilio credentials, OTP endpoints succeed in DEV MODE
#   but do not send real SMS. This is useful for local testing.
# - Stability AI (dev): Missing STABILITY_API_KEY triggers placeholder images
#   instead of external API calls.
