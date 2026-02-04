import { Request, Response } from "express";
import { listPhotos, uploadPhoto } from "../services/photoService";

export async function listPhotosHandler(req: Request, res: Response) {
  const photos = await listPhotos(res.locals.user.id);
  return res.json({ photos });
}

export async function uploadPhotoHandler(req: Request, res: Response) {
  const { filename, dataUrl } = req.body as { filename: string; dataUrl: string };
  const photo = await uploadPhoto({ userId: res.locals.user.id, filename, dataUrl });
  return res.json({ photo });
}
