#!/usr/bin/env node
/**
 * Add a project to the top of the work grid and publish it.
 *
 * Usage (from the repo folder):
 *   node scripts/add-project.js ~/Desktop/poster.jpg "Project title"
 *
 * Copies the image into images/work/, adds it to the top of work.json with its
 * width and height, then commits and pushes so the live site updates.
 * Add --no-push to stop before committing.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const noPush = args.includes('--no-push');
const [src, title] = args.filter(a => a !== '--no-push');

if (!src || !title) {
  console.log('Usage: node scripts/add-project.js path/to/image.jpg "Project title"');
  process.exit(1);
}
if (!fs.existsSync(src)) {
  console.error('Can\'t find that image:', src);
  process.exit(1);
}

const root = path.join(__dirname, '..');
const git = (...a) => execFileSync('git', a, { cwd: root, stdio: 'inherit' });

if (!noPush) git('pull', '--ff-only');

// Copy the image in, with a web-safe file name
const ext = path.extname(src).toLowerCase();
const base = path.basename(src, path.extname(src))
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
let name = base + ext;
for (let n = 2; fs.existsSync(path.join(root, 'images/work', name)); n++) name = `${base}-${n}${ext}`;
fs.copyFileSync(src, path.join(root, 'images/work', name));

// Add it to the top of work.json, then record sizes
const workPath = path.join(root, 'work.json');
const items = JSON.parse(fs.readFileSync(workPath, 'utf8'));
items.unshift({ title, image: `images/work/${name}` });
fs.writeFileSync(workPath, JSON.stringify(items, null, 2) + '\n');
execFileSync(process.execPath, [path.join(__dirname, 'image-sizes.js')], { stdio: 'inherit' });

console.log(`Added "${title}" (images/work/${name}) to the top of the grid.`);

if (noPush) {
  console.log('Not published (--no-push). Commit and push when ready.');
} else {
  git('add', 'work.json', `images/work/${name}`);
  git('commit', '-m', `Add ${title}`);
  git('push');
  console.log('Published. The site updates in a minute or two.');
}
