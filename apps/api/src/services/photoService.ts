import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

const uploadsDir = path.join(process.cwd(), "uploads");

export function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

export async function listPhotos(userId: string) {
  return prisma.photo.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });
}

export async function uploadPhoto(options: { userId: string; filename: string; dataUrl: string }) {
  const matches = options.dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new HttpError(400, { error: "Invalid image data." });
  }
  const [, mimeType, base64Data] = matches;
  const extension = mimeType.split("/")[1] ?? "jpg";
  const fileName = `${crypto.randomUUID()}-${options.filename}`.replace(/\s+/g, "_");
  const filePath = path.join(uploadsDir, `${fileName}.${extension}`);
  await fs.promises.writeFile(filePath, Buffer.from(base64Data, "base64"));
  const url = `/uploads/${path.basename(filePath)}`;
  return prisma.photo.create({
    data: {
      userId: options.userId,
      url
    }
  });
}
