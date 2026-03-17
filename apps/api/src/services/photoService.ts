import fs from "fs";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { HttpError } from "../utils/httpErrors";

const uploadsDir = path.join(process.cwd(), "uploads");
const PROFILE_BUCKET = "profile-photos";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const extensionMap: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

let supabaseClient: SupabaseClient | null = null;

export function ensureUploadsDir() {
  if (env.STORAGE_PROVIDER !== "local") return;
  const profilesDir = path.join(uploadsDir, "profiles");
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }
}

export async function listPhotos(userId: string) {
  return prisma.photo.findMany({
    where: { userId },
    orderBy: [{ photoIndex: "asc" }, { createdAt: "asc" }]
  });
}

function getSupabaseClient() {
  if (!supabaseClient) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new HttpError(500, { message: "Supabase storage is not configured." });
    }
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabaseClient;
}

function calculateBase64Size(base64: string) {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

async function deleteLocalFileFromUrl(url: string | null | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  const filePath = path.join(process.cwd(), url.replace("/uploads/", "uploads/"));
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

function extractSupabasePath(url: string) {
  const marker = `/storage/v1/object/public/${PROFILE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

async function ensureSupabaseBucket() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.getBucket(PROFILE_BUCKET);
  if (data && !error) return;
  const { error: createError } = await supabase.storage.createBucket(PROFILE_BUCKET, { public: true });
  if (createError && createError.message !== "The resource already exists") {
    throw new HttpError(500, { message: "Unable to initialize photo storage bucket." });
  }
}

async function removePhotoAsset(url: string) {
  if (env.STORAGE_PROVIDER === "supabase") {
    const storagePath = extractSupabasePath(url);
    if (storagePath) {
      const supabase = getSupabaseClient();
      await supabase.storage.from(PROFILE_BUCKET).remove([storagePath]);
    }
  } else {
    await deleteLocalFileFromUrl(url);
  }
}

export async function uploadPhoto(options: { userId: string; filename: string; dataUrl: string; cropX?: number; cropY?: number; cropZoom?: number }) {
  const matches = options.dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new HttpError(400, { message: "Invalid image data." });
  }
  const [, mimeType, base64Data] = matches;
  if (!allowedMimeTypes.has(mimeType)) {
    throw new HttpError(400, { message: "Only JPEG, PNG, or WebP images are supported." });
  }
  const extension = extensionMap[mimeType] ?? "jpg";
  const size = calculateBase64Size(base64Data);
  if (size > MAX_FILE_SIZE_BYTES) {
    throw new HttpError(413, { message: "Image must be 10MB or smaller." });
  }
  const existingCount = await prisma.photo.count({ where: { userId: options.userId } });
  if (existingCount >= 3) {
    throw new HttpError(400, { message: "You can upload up to 3 photos only." });
  }

  const buffer = Buffer.from(base64Data, "base64");
  const storagePath = `profiles/${options.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  let url: string;
  if (env.STORAGE_PROVIDER === "supabase") {
    await ensureSupabaseBucket();
    const supabase = getSupabaseClient();
    const { error } = await supabase.storage.from(PROFILE_BUCKET).upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false
    });
    if (error) {
      throw new HttpError(500, { message: "Unable to upload photo. Please try again." });
    }
    const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(storagePath);
    url = data.publicUrl;
  } else {
    const filePath = path.join(uploadsDir, storagePath);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
    url = `/uploads/${storagePath}`;
  }
  return prisma.photo.create({
    data: {
      userId: options.userId,
      url,
      cropX: options.cropX,
      cropY: options.cropY,
      cropZoom: options.cropZoom,
      photoIndex: existingCount
    }
  });
}

export async function deletePhoto(options: { userId: string; photoId: string }) {
  const photo = await prisma.photo.findFirst({ where: { id: options.photoId, userId: options.userId } });
  if (!photo) {
    throw new HttpError(404, { message: "Photo not found." });
  }

  const photoCount = await prisma.photo.count({ where: { userId: options.userId } });
  if (photoCount <= 1) {
    throw new HttpError(400, { message: "At least one profile photo is required." });
  }

  await removePhotoAsset(photo.url);
  await prisma.photo.delete({ where: { id: photo.id } });

  const remaining = await prisma.photo.findMany({
    where: { userId: options.userId },
    orderBy: [{ photoIndex: "asc" }, { createdAt: "asc" }],
    select: { id: true }
  });

  await Promise.all(
    remaining.map((item, index) =>
      prisma.photo.update({
        where: { id: item.id },
        data: { photoIndex: index }
      })
    )
  );
}

export async function reorderPhotos(options: { userId: string; photoIds: string[] }) {
  const existing = await prisma.photo.findMany({ where: { userId: options.userId }, select: { id: true } });
  if (existing.length !== options.photoIds.length) {
    throw new HttpError(400, { message: "Photo reorder payload does not match existing photos." });
  }

  const existingIds = new Set(existing.map((photo) => photo.id));
  if (options.photoIds.some((id) => !existingIds.has(id)) || new Set(options.photoIds).size !== options.photoIds.length) {
    throw new HttpError(400, { message: "Photo reorder payload contains invalid photo ids." });
  }

  await Promise.all(
    options.photoIds.map((photoId, index) =>
      prisma.photo.update({ where: { id: photoId }, data: { photoIndex: index } })
    )
  );

  return { updated: true };
}
