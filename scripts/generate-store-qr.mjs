import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import sharp from 'sharp';

const directory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(directory, '../public');
const storeUrl = 'https://ababil-tau.vercel.app';
const qrSize = 2000;
const logoFrameSize = 300;
const logoSize = 210;
const options = {
  errorCorrectionLevel: 'H',
  margin: 4,
  color: {
    dark: '#102b24',
    light: '#fbf7ed',
  },
};

const frameSvg = (size) =>
  Buffer.from(`
    <svg width="${qrSize}" height="${qrSize}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${(qrSize - size) / 2}" y="${(qrSize - size) / 2}" width="${size}" height="${size}" rx="36" fill="#fbf7ed" stroke="#c9a45c" stroke-width="12" />
    </svg>
  `);

const logo = await sharp(path.join(publicDirectory, 'logo.jpeg'))
  .resize(logoSize, logoSize, { fit: 'contain', background: '#fbf7ed' })
  .png()
  .toBuffer();
const pngQr = await QRCode.toBuffer(storeUrl, { ...options, width: qrSize });
const logoPosition = (qrSize - logoSize) / 2;

await sharp(pngQr)
  .composite([
    { input: frameSvg(logoFrameSize), top: 0, left: 0 },
    { input: logo, top: logoPosition, left: logoPosition },
  ])
  .png()
  .toFile(path.join(publicDirectory, 'ababil-store-qr.png'));

const svgSize = 1200;
const svgLogoSize = 126;
const svgFrameSize = 180;
const svgLogo = await sharp(logo)
  .resize(svgLogoSize, svgLogoSize, { fit: 'contain', background: '#fbf7ed' })
  .png()
  .toBuffer();
const qrSvg = await QRCode.toString(storeUrl, {
  ...options,
  type: 'svg',
  width: svgSize,
});
const svgCenter = svgSize / 2;
const brandedSvg = qrSvg.replace(
  '</svg>',
  `<rect x="${svgCenter - svgFrameSize / 2}" y="${svgCenter - svgFrameSize / 2}" width="${svgFrameSize}" height="${svgFrameSize}" rx="22" fill="#fbf7ed" stroke="#c9a45c" stroke-width="7"/><image href="data:image/png;base64,${svgLogo.toString('base64')}" x="${svgCenter - svgLogoSize / 2}" y="${svgCenter - svgLogoSize / 2}" width="${svgLogoSize}" height="${svgLogoSize}"/></svg>`
);

await fs.writeFile(path.join(publicDirectory, 'ababil-store-qr.svg'), brandedSvg);

console.log(`Created QR code for ${storeUrl}`);
