import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const directory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(directory, '../public');
const storeUrl = 'https://ababil-tau.vercel.app';
const options = {
  errorCorrectionLevel: 'H',
  margin: 4,
  color: {
    dark: '#102b24',
    light: '#fbf7ed',
  },
};

await QRCode.toFile(
  path.join(publicDirectory, 'ababil-store-qr.png'),
  storeUrl,
  { ...options, width: 2000 }
);

await QRCode.toFile(
  path.join(publicDirectory, 'ababil-store-qr.svg'),
  storeUrl,
  { ...options, type: 'svg', width: 1200 }
);

console.log(`Created QR code for ${storeUrl}`);
