import fs from 'node:fs/promises';
import path from 'node:path';
import type { EvidenceStorage } from './interface';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export class LocalStorage implements EvidenceStorage {
  async save(buffer: Buffer, filename: string): Promise<string> {
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
    return `/uploads/${filename}`;
  }
  async read(url: string): Promise<Buffer> {
    return fs.readFile(path.join(UPLOAD_DIR, path.basename(url)));
  }
}