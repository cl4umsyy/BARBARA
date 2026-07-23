const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourcePath = 'C:/Users/THINKPAD/.gemini/antigravity-ide/brain/b5e4785f-6244-4ab1-9a47-d01909a3d316/media__1784709959525.png';

function createIco(pngBuffers) {
  const numImages = pngBuffers.length;
  const headerSize = 6 + numImages * 16;
  let currentOffset = headerSize;
  const dirEntries = [];
  
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.buffer.length, 8);
    entry.writeUInt32LE(currentOffset, 12);
    dirEntries.push(entry);
    currentOffset += img.buffer.length;
  }
  
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(numImages, 4);
  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(b => b.buffer)]);
}

async function run() {
  const trimmed = await sharp(sourcePath).trim().toBuffer();
  const trimmedMeta = await sharp(trimmed).metadata();

  async function makeSquareIcon(targetSize, paddingRatio = 0.78) {
    const maxDim = targetSize * paddingRatio;
    const scale = Math.min(maxDim / trimmedMeta.width, maxDim / trimmedMeta.height);
    const newW = Math.round(trimmedMeta.width * scale);
    const newH = Math.round(trimmedMeta.height * scale);

    const resizedLogo = await sharp(trimmed).resize(newW, newH).toBuffer();

    return await sharp({
      create: {
        width: targetSize,
        height: targetSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{ input: resizedLogo, gravity: 'center' }])
    .png()
    .toBuffer();
  }

  const sizes = [16, 32, 48, 180, 192, 512];
  const pngMap = {};

  for (const size of sizes) {
    pngMap[size] = await makeSquareIcon(size);
  }

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: pngMap[16] },
    { width: 32, height: 32, buffer: pngMap[32] },
    { width: 48, height: 48, buffer: pngMap[48] }
  ]);

  const publicDir = path.join(__dirname, '..', 'public');
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), pngMap[16]);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), pngMap[32]);
  fs.writeFileSync(path.join(publicDir, 'favicon-48x48.png'), pngMap[48]);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngMap[180]);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pngMap[192]);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pngMap[512]);
  fs.writeFileSync(path.join(publicDir, 'android-chrome-192x192.png'), pngMap[192]);
  fs.writeFileSync(path.join(publicDir, 'android-chrome-512x512.png'), pngMap[512]);

  const appDir = path.join(__dirname, '..', 'src', 'app');
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'icon.png'), pngMap[512]);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), pngMap[180]);

  console.log('SUCCESS_GENERATED_ALL_ICONS');
}

run().catch(console.error);
