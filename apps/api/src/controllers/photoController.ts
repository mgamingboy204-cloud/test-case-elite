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
