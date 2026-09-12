import fs from 'fs';
import zlib from 'zlib';

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

// Distance from point (px, py) to line segment (x1, y1) -> (x2, y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function createAxPng(width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = writeChunk('IHDR', ihdr);
  const rowStride = width * 4;
  const rawData = Buffer.alloc(height * (1 + rowStride));

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      // Normalize coords to [0, 1]
      const u = x / (width - 1);
      const v = y / (height - 1);

      // Distance from center
      const dx = u - 0.5;
      const dy = v - 0.5;

      // Squircle background badge (rounded square)
      const rx = Math.abs(dx) / 0.44;
      const ry = Math.abs(dy) / 0.44;
      const squircle = Math.pow(rx, 4) + Math.pow(ry, 4);

      let r = 7, g = 10, b = 17, a = 255;

      if (squircle <= 1.0) {
        // Deep obsidian backdrop with radial cyan/emerald glow
        const centerDist = Math.hypot(dx, dy);
        const glowFactor = Math.max(0, 1 - centerDist / 0.4);
        r = Math.round(11 + 8 * glowFactor);
        g = Math.round(16 + 25 * glowFactor);
        b = Math.round(26 + 30 * glowFactor);

        // Subtle border
        if (squircle >= 0.88) {
          const borderProgress = (u + (1 - v)) / 2;
          r = Math.round(16 * (1 - borderProgress) + 6 * borderProgress);
          g = Math.round(185 * (1 - borderProgress) + 182 * borderProgress);
          b = Math.round(129 * (1 - borderProgress) + 212 * borderProgress);
        }

        // --- RENDER "AX" GEOMETRY ---
        // Letter 'A'
        // Left leg: (0.24, 0.72) to (0.39, 0.28)
        const dALeft = distToSegment(u, v, 0.24, 0.72, 0.39, 0.28);
        // Right leg: (0.39, 0.28) to (0.49, 0.58)
        const dARight = distToSegment(u, v, 0.39, 0.28, 0.49, 0.58);
        // Crossbar: (0.30, 0.54) to (0.47, 0.54)
        const dACross = distToSegment(u, v, 0.30, 0.54, 0.47, 0.54);

        // Letter 'X'
        // Falling leg of X: (0.55, 0.28) to (0.76, 0.72)
        const dXFall = distToSegment(u, v, 0.55, 0.28, 0.76, 0.72);
        // Rising bull arrow leg of X: (0.52, 0.72) to (0.75, 0.28)
        const dXRise = distToSegment(u, v, 0.52, 0.72, 0.75, 0.28);

        // Arrowhead at top of rising X stroke: (0.75, 0.28)
        const dArrow1 = distToSegment(u, v, 0.75, 0.28, 0.79, 0.24);
        const dArrow2 = distToSegment(u, v, 0.79, 0.24, 0.73, 0.22);
        const dArrow3 = distToSegment(u, v, 0.79, 0.24, 0.81, 0.30);

        // Baseline indicator
        const dBase = distToSegment(u, v, 0.18, 0.80, 0.82, 0.80);

        const strokeW = 0.038;
        const arrowW = 0.032;

        const isA = (dALeft <= strokeW || dARight <= strokeW || dACross <= strokeW * 0.8);
        const isX = (dXFall <= strokeW || dXRise <= strokeW || dArrow1 <= arrowW || dArrow2 <= arrowW || dArrow3 <= arrowW);
        const isBase = dBase <= 0.008 && (u >= 0.18 && u <= 0.82);

        if (isA) {
          // Vibrant Emerald gradient
          const factor = (1 - v);
          r = Math.round(5 * (1 - factor) + 16 * factor);
          g = Math.round(150 * (1 - factor) + 210 * factor);
          b = Math.round(105 * (1 - factor) + 160 * factor);
        } else if (isX) {
          // Electric Cyan & Teal bull market arrow
          const factor = (1 - v);
          r = Math.round(16 * (1 - factor) + 56 * factor);
          g = Math.round(185 * (1 - factor) + 220 * factor);
          b = Math.round(210 * (1 - factor) + 248 * factor);
        } else if (isBase) {
          r = 16; g = 185; b = 129;
        }
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

// Generate new icons with clear AX emblem
const icon192 = createAxPng(192, 192);
fs.writeFileSync('public/icon-192.png', icon192);
console.log('Regenerated public/icon-192.png (AX Logo)');

const icon512 = createAxPng(512, 512);
fs.writeFileSync('public/icon-512.png', icon512);
console.log('Regenerated public/icon-512.png (AX Logo)');

const faviconPng = createAxPng(64, 64);
fs.writeFileSync('public/favicon.png', faviconPng);
console.log('Regenerated public/favicon.png (AX Logo)');

const logoPng = createAxPng(256, 256);
fs.writeFileSync('public/logo.png', logoPng);
console.log('Regenerated public/logo.png (AX Logo)');
