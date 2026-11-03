#!/usr/bin/env node
/**
 * Downloads work images from Webflow CDN into images/work/
 * Run before cancelling Webflow: node download-assets.js
 * Requires: Node.js (no deps) or install node-fetch for older Node
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const workPath = path.join(__dirname, 'work.json');
const workOutDir = path.join(__dirname, 'images', 'work');
const imagesDir = path.join(__dirname, 'images');

const extraAssets = [
  { url: 'https://cdn.prod.website-files.com/644a811a3231c77ef3c6f1c7/644a886e6788d8407c44c572_hideoutlogo.svg', file: 'hideoutlogo.svg' },
  { url: 'https://assets.website-files.com/644a811a3231c77ef3c6f1c7/644feca82e72867f4369f9b5_TWO%20TOO%20MUCH%206.png', file: 'two-too-much.png' },
  { url: 'https://cdn.prod.website-files.com/640a4845d6a6bb067b0615ca/644a81b5ea0eade2b5f22c83_Vectors-Wrapper.svg', file: 'home-icon.svg' }
];

if (!fs.existsSync(workOutDir)) {
  fs.mkdirSync(workOutDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const work = JSON.parse(fs.readFileSync(workPath, 'utf8'));

function download(url, outDir, customFilename) {
  return new Promise((resolve, reject) => {
    const filename = customFilename || decodeURIComponent(url.split('/').pop());
    const outPath = path.join(outDir, filename);

    if (fs.existsSync(outPath)) {
      console.log('Skip (exists):', filename);
      resolve();
      return;
    }

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`${url} -> ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(outPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Saved:', filename);
        resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  for (const { url, file } of extraAssets) {
    try {
      await download(url, imagesDir, file);
    } catch (e) {
      console.error('Failed (extra):', file, e.message);
    }
  }

  const urls = [...new Set(work.map((item) => item.webflowUrl).filter(Boolean))];
  console.log(`Downloading ${urls.length} work images to ${workOutDir}...`);

  for (const url of urls) {
    try {
      await download(url, workOutDir);
    } catch (e) {
      console.error('Failed:', url, e.message);
    }
  }

  console.log('Done.');
}

main();
