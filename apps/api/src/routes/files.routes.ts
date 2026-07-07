import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "@/middleware/auth.middleware";
import { r2Service } from "@/services/r2.service";
import { asyncHandler } from "@/utils/asyncHandler";

const uploadDir = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

const imageFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WebP, SVG)"));
};

const useR2 = r2Service.isConfigured();

const storage = useR2
  ? multer.memoryStorage()
  : multer.diskStorage({
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
  fileFilter: imageFilter,
});

function parsePathParts(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((part): part is string => typeof part === "string");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((part): part is string => typeof part === "string");
      }
    } catch {
      return raw.split("/").filter(Boolean);
    }
  }
  return [];
}

function buildDownloadUrl(
  req: { protocol: string; get: (name: string) => string | undefined },
  key: string,
): string {
  const host = req.get("host");
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${req.protocol}://${host}/files/download/${encodedKey}`;
}

export const filesRoutes = Router();

filesRoutes.post(
  "/upload",
  authMiddleware,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false, error: err.message });
        return;
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    const bucket =
      typeof req.body?.bucket === "string" ? req.body.bucket : undefined;
    const pathParts = parsePathParts(req.body?.path);

    if (useR2) {
      const filename =
        pathParts.length > 0
          ? pathParts[pathParts.length - 1]!
          : req.file.originalname.replace(/[^\w.-]+/g, "_");
      const directory = pathParts.slice(0, -1);
      const uploadPath =
        directory.length > 0 ? [...directory, filename] : [filename];

      const { key, url } = await r2Service.upload({
        bucket,
        path: uploadPath,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
      });

      const fileUrl = url ?? buildDownloadUrl(req, key);

      res.json({
        success: true,
        data: {
          path: key,
          url: fileUrl,
        },
      });
      return;
    }

    const localPath = req.file.filename;
    const fileUrl = buildDownloadUrl(req, localPath);

    res.json({
      success: true,
      data: {
        path: localPath,
        url: fileUrl,
      },
    });
  }),
);

filesRoutes.get(
  /^\/download\/(.+)/,
  authMiddleware,
  asyncHandler(async (req, res) => {
    const key = (req.params[0] ?? "")
      .split("/")
      .map(decodeURIComponent)
      .join("/");

    if (!key) {
      res.status(400).json({ success: false, error: "File path is required" });
      return;
    }

    if (useR2) {
      try {
        const { body, contentType } = await r2Service.download(key);
        if (contentType) {
          res.setHeader("Content-Type", contentType);
        }
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        body.pipe(res);
        return;
      } catch {
        res.status(404).json({ success: false, error: "File not found" });
        return;
      }
    }

    const filename = path.basename(key);
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: "File not found" });
      return;
    }

    res.sendFile(filePath);
  }),
);