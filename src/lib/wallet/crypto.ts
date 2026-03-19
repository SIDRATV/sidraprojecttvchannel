import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { walletConfig } from './config';

const ALGORITHM = 'aes-256-gcm';

const deriveKey = (): Buffer => {
  if (!walletConfig.encryptionKey) {
    throw new Error('WALLET_ENCRYPTION_KEY is not configured');
  }

  return createHash('sha256').update(walletConfig.encryptionKey).digest();
};

export const encryptText = (plainText: string): string => {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptText = (cipherText: string): string => {
  const [ivHex, tagHex, dataHex] = cipherText.split(':');

  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Invalid encrypted payload format');
  }

  const key = deriveKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};
