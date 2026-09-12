import fs from 'fs';
import zlib from 'zlib';

// Table for CRC32 calculation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

export function createPng(width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // Compression method
  ihdr.writeUInt8(0, 11); // Filter method
  ihdr.writeUInt8(0, 12); // Interlace method

  const ihdrChunk = writeChunk('IHDR', ihdr);

  // Generate pixel data (RGBA) with scanline filter byte 0
  const rowStride = width * 4;
  const rawData = Buffer.alloc(height * (1 + rowStride));

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background: Dark terminal aesthetic #070a11 with rounded container
      let r = 7, g = 10, b = 17, a = 255;

      // Rounded squircle container
      const rx = Math.abs(dx) / (width * 0.46);
      const ry = Math.abs(dy) / (height * 0.46);
      const squircle = Math.pow(rx, 4) + Math.pow(ry, 4);

      if (squircle <= 1.0) {
        // Subtle radial gradient background: deep navy to dark violet
        const grad = Math.min(1, dist / radius);
        r = Math.round(11 + (15 - 11) * (1 - grad));
        g = Math.round(15 + (22 - 15) * (1 - grad));
        b = Math.round(26 + (45 - 26) * (1 - grad));

        // Draw Apex Trade Stylized 'A' / Upward Trading Chevron
        const nx = (x - cx) / (width * 0.32);
        const ny = (y - cy) / (height * 0.32);

        // Chevron: Top-to-Bottom Apex
        const inApexChevron = (
          ny >= -0.7 && ny <= 0.6 &&
          Math.abs(nx) <= (0.55 * (ny + 0.95)) &&
          Math.abs(nx) >= (0.55 * (ny + 0.95) - 0.38) &&
          ny >= -0.6
        );

        // Horizontal bar of the 'A'
        const inCrossBar = (
          ny >= 0.05 && ny <= 0.22 &&
          Math.abs(nx) <= 0.45
        );

        // Bullish Growth Accent (Cyan upward accent star at apex)
        const apexDist = Math.sqrt(nx * nx + (ny + 0.72) * (ny + 0.72));

        if (apexDist <= 0.18) {
          // Electric Cyan / Teal
          r = 56; g = 189; b = 248; a = 255;
        } else if (inApexChevron || inCrossBar) {
          // Vibrant Violet-Purple gradient: #8b5cf6 -> #6366f1
          const factor = (ny + 0.6) / 1.2;
          r = Math.round(139 * (1 - factor) + 99 * factor);
          g = Math.round(92 * (1 - factor) + 102 * factor);
          b = Math.round(246 * (1 - factor) + 241 * factor);
          a = 255;
        }
      } else {
        r = 7; g = 10; b = 17; a = 255;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = writeChunk('IDAT', compressedData);
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate icons
const icon192 = createPng(192, 192);
fs.writeFileSync('public/icon-192.png', icon192);
console.log('Created public/icon-192.png (size:', icon192.length, 'bytes)');

const icon512 = createPng(512, 512);
fs.writeFileSync('public/icon-512.png', icon512);
console.log('Created public/icon-512.png (size:', icon512.length, 'bytes)');

const faviconPng = createPng(64, 64);
fs.writeFileSync('public/favicon.png', faviconPng);
console.log('Created public/favicon.png (size:', faviconPng.length, 'bytes)');
