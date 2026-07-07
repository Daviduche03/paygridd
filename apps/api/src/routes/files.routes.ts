import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "@/middleware/auth.middleware";

const uploadDir = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^\w.-]+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const filesRoutes = Router();

filesRoutes.post(
  "/upload",
  authMiddleware,
  upload.single("file") as any,
  (req, res) => {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    res.json({
      success: true,
      data: {
        path: req.file.filename,
      },
    });
  },
);

filesRoutes.get("/download/:filename", authMiddleware, (req, res) => {
  const filename = path.basename(req.params.filename!);
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, error: "File not found" });
    return;
  }

  res.sendFile(filePath);
});
