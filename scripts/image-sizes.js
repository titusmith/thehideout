#!/usr/bin/env node
/**
 * Adds width and height to every entry in work.json, read from the image files.
 * The grid uses them to reserve each image's space before it loads, so nothing jumps.
 *
 * Usage: node scripts/image-sizes.js
 * Run it after adding or replacing a project image. No dependencies.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const workPath = path.join(root, 'work.json');

function readSize(buf) {
  // PNG
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // GIF
  if (buf.toString('ascii', 0, 3) === 'GIF') {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  // WebP
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    }
    if (chunk === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8 ') {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
  }
  // JPEG: walk markers to the first start-of-frame
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  return null;
}

const items = JSON.parse(fs.readFileSync(workPath, 'utf8'));
let missing = 0;
for (const item of items) {
  const file = path.join(root, item.image);
  if (!fs.existsSync(file)) { console.warn('Missing file:', item.image); missing++; continue; }
  const size = readSize(fs.readFileSync(file));
  if (!size) { console.warn('Unknown format:', item.image); missing++; continue; }
  item.width = size.width;
  item.height = size.height;
}
fs.writeFileSync(workPath, JSON.stringify(items, null, 2) + '\n');
console.log(`Sized ${items.length - missing} of ${items.length} images.`);
