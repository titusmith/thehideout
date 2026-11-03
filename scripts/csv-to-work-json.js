#!/usr/bin/env node
/**
 * Converts Webflow Works CSV to work.json, sorted by Publish Date (newest first).
 * Excludes Draft and Archived items.
 * Usage: node scripts/csv-to-work-json.js < path/to/csv > work.json
 */

const fs = require('fs');
const path = require('path');

const csvPath = process.argv[2] || path.join(process.env.HOME, 'Downloads', 'The Hideout - Works - 644a9034c6dd316accdb69c3.csv');
const outPath = path.join(__dirname, '..', 'work.json');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' && !inQuotes) || c === '\n') {
      result.push(current.trim());
      current = '';
      if (c === '\n') break;
    } else {
      current += c;
    }
  }
  if (current !== '') result.push(current.trim());
  return result;
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  const header = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    header.forEach((h, j) => { row[h] = values[j] || ''; });
    rows.push(row);
  }
  return rows;
}

function urlToLocalImage(url) {
  if (!url) return '';
  const filename = url.split('/').pop();
  return `images/work/${decodeURIComponent(filename)}`;
}

const content = fs.readFileSync(csvPath, 'utf8');
const rows = parseCSV(content);

const works = rows
  .filter(r => r.Draft !== 'true' && r.Archived !== 'true' && r['Main Project Image'])
  .map(r => ({
    title: r.Name,
    image: urlToLocalImage(r['Main Project Image']),
    webflowUrl: r['Main Project Image'],
    publishDate: r['Publish Date']
  }))
  .sort((a, b) => {
    const dateA = new Date(a.publishDate).getTime();
    const dateB = new Date(b.publishDate).getTime();
    return dateB - dateA; // newest first
  })
  .map(({ title, image, webflowUrl }) => ({ title, image, webflowUrl }));

fs.writeFileSync(outPath, JSON.stringify(works, null, 2));
console.log(`Wrote ${works.length} items to ${outPath} (sorted by Publish Date, newest first)`);
