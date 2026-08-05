import { logger } from "#core/logger";
import { LocalStorage } from './local';
import { CloudinaryStorage } from './cloudinary';

export const storage = process.env.CLOUDINARY_URL ? new CloudinaryStorage() : new LocalStorage();
logger.info(`Using ${storage.constructor.name} for evidence storage`);