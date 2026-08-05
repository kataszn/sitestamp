import { v2 as cloudinary } from 'cloudinary';
import type { EvidenceStorage } from './interface';
import { AppError, Errors } from '#core/errors.js';

export class CloudinaryStorage implements EvidenceStorage {
  async save(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    const resourceType = mimeType.startsWith('video') || mimeType.startsWith('audio') ? 'video' : 'image';
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: resourceType, public_id: filename },
        (err, result) => (err ? reject(err) : resolve(result!.secure_url))
      );
      stream.end(buffer);
    });
  }

  async read(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) throw new AppError(Errors.INTERNAL, { message: `Failed to fetch evidence from storage: ${res.status}` });
    return Buffer.from(await res.arrayBuffer());
  }
}