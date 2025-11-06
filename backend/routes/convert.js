// routes/convert.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

// pdf-parse import fix
import pkg from "pdf-parse";
const pdfParse = pkg;

// mammoth (for basic DOCX → TXT)
import mammoth from "mammoth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

/**
 * Utility to call Python microservice (pdf2docx/docx2pdf)
 */
function runPython(script, args = []) {
  return new Promise((resolve, reject) => {
    const py = spawn("python", [script, ...args]);

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    py.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    py.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Python exited with ${code}: ${stderr}`));
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Conversion endpoint
 * POST /api/convert/file
 */
router.post("/file", upload.single("file"), async (req, res) => {
  try {
    const { format } = req.body; // target format: "txt", "docx", "pdf"
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const inputPath = file.path;
    const originalExt = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, originalExt);
    const outputPath = path.join(uploadsDir, `${baseName}.${format}`);

    // === PDF → TXT ===
    if (originalExt === ".pdf" && format === "txt") {
      const dataBuffer = fs.readFileSync(inputPath);
      const data = await pdfParse(dataBuffer);
      fs.unlinkSync(inputPath); // cleanup
      return res.type("text/plain").send(data.text);
    }

    // === DOCX → TXT ===
    if (originalExt === ".docx" && format === "txt") {
      const result = await mammoth.extractRawText({ path: inputPath });
      fs.unlinkSync(inputPath);
      return res.type("text/plain").send(result.value);
    }

    // === PDF → DOCX === (via Python pdf2docx)
    if (originalExt === ".pdf" && format === "docx") {
      await runPython(path.join(__dirname, "../scripts/pdf_to_docx.py"), [
        inputPath,
        outputPath,
      ]);
      fs.unlinkSync(inputPath);
      return res.download(outputPath, `${baseName}.docx`, () => {
        fs.unlinkSync(outputPath);
      });
    }

    // === DOCX → PDF === (via Python docx2pdf)
    if (originalExt === ".docx" && format === "pdf") {
      await runPython(path.join(__dirname, "../scripts/docx_to_pdf.py"), [
        inputPath,
        outputPath,
      ]);
      fs.unlinkSync(inputPath);
      return res.download(outputPath, `${baseName}.pdf`, () => {
        fs.unlinkSync(outputPath);
      });
    }

    // Unsupported combo
    return res.status(400).json({ error: "Unsupported conversion type" });
  } catch (err) {
    console.error("Conversion error:", err);
    res.status(500).json({ error: "Conversion failed", details: err.message });
  }
});

export default router;
