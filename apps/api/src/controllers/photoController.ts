import { Request, Response } from "express";
import { deletePhoto, listPhotos, uploadPhoto } from "../services/photoService";

export async function listPhotosHandler(req: Request, res: Response) {
  const photos = await listPhotos(res.locals.user.id);
  return res.json({ photos });
}

export async function uploadPhotoHandler(req: Request, res: Response) {
  const { filename, dataUrl, cropX, cropY, cropZoom } = req.body as {
    filename: string;
    dataUrl: string;
    cropX?: number;
    cropY?: number;
    cropZoom?: number;
  };
  const photo = await uploadPhoto({ userId: res.locals.user.id, filename, dataUrl, cropX, cropY, cropZoom });
  return res.json({ photo });
}

export async function deletePhotoHandler(req: Request, res: Response) {
  const photoId = req.params.photoId;
  if (!photoId) return res.status(400).json({ message: "photoId is required" });

  await deletePhoto({ userId: res.locals.user.id, photoId });
  return res.json({ ok: true });
}


export async function requestPhotoUploadUrlHandler(req: Request, res: Response) {
  const { filename, mimeType } = req.body as { filename: string; mimeType: string };
  const uploadToken = Buffer.from(JSON.stringify({ filename, mimeType, userId: res.locals.user.id, issuedAt: Date.now() })).toString("base64url");
  return res.json({ uploadToken, maxPhotos: 3, acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"] });
}

export async function confirmPhotoUploadHandler(req: Request, res: Response) {
  const { uploadToken, filename, dataUrl, cropX, cropY, cropZoom } = req.body as { uploadToken: string; filename: string; dataUrl: string; cropX?: number; cropY?: number; cropZoom?: number };
  if (!uploadToken) return res.status(400).json({ message: "uploadToken is required" });
  const photo = await uploadPhoto({ userId: res.locals.user.id, filename, dataUrl, cropX, cropY, cropZoom });
  return res.json({ photo });
}
