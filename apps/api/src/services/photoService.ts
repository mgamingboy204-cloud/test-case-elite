import fs from "fs";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { HttpError } from "../utils/httpErrors";

const uploadsDir = path.join(process.cwd(), "uploads");
const PROFILE_BUCKET = "profile-photos";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
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
    orderBy: { createdAt: "asc" }
  });
}

function getSupabaseClient() {
  if (!supabaseClient) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new HttpError(500, { error: "Supabase storage is not configured." });
    }
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabaseClient;
}

function calculateBase64Size(base64: string) {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

function resolveStoragePath(userId: string, extension: string) {
  return `profiles/${userId}/avatar.${extension}`;
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
    throw new HttpError(500, { error: "Unable to initialize photo storage bucket." });
  }
}

async function removeExistingPhoto(userId: string) {
  const existing = await prisma.photo.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  if (!existing) return;
  if (env.STORAGE_PROVIDER === "supabase") {
    const storagePath = extractSupabasePath(existing.url);
    if (storagePath) {
      const supabase = getSupabaseClient();
      await supabase.storage.from(PROFILE_BUCKET).remove([storagePath]);
    }
  } else {
    await deleteLocalFileFromUrl(existing.url);
  }
  await prisma.photo.deleteMany({ where: { userId } });
}

export async function uploadPhoto(options: { userId: string; filename: string; dataUrl: string }) {
  const matches = options.dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new HttpError(400, { error: "Invalid image data." });
  }
  const [, mimeType, base64Data] = matches;
  if (!allowedMimeTypes.has(mimeType)) {
    throw new HttpError(400, { error: "Only JPEG, PNG, or WebP images are supported." });
  }
  const extension = extensionMap[mimeType] ?? "jpg";
  const size = calculateBase64Size(base64Data);
  if (size > MAX_FILE_SIZE_BYTES) {
    throw new HttpError(413, { error: "Image must be 5MB or smaller." });
  }
  await removeExistingPhoto(options.userId);

  const buffer = Buffer.from(base64Data, "base64");
  const storagePath = resolveStoragePath(options.userId, extension);
  let url: string;
  if (env.STORAGE_PROVIDER === "supabase") {
    await ensureSupabaseBucket();
    const supabase = getSupabaseClient();
    const { error } = await supabase.storage.from(PROFILE_BUCKET).upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false
    });
    if (error) {
      throw new HttpError(500, { error: "Unable to upload photo. Please try again." });
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
      url
    }
  });
}
