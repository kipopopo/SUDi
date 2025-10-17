import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export const uploadFile = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const tempPath = req.file!.path;
  const targetPath = path.join(__dirname, '../uploads', req.file!.originalname);

  fs.rename(tempPath, targetPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    res.status(200).json({ filePath: `uploads/${req.file!.originalname}` });
  });
};