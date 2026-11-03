#!/usr/bin/env node
/**
 * Work grid editor that runs only on your own computer.
 *
 * Usage (from the site folder):
 *   node scripts/admin.js
 *
 * Opens http://localhost:4321 in your browser. Add, retitle, remove and drag
 * projects into order, then click Publish. Publish saves work.json, records
 * image sizes, and commits and pushes with your own git login.
 *
 * Nothing here is part of the public site: the editor page lives inside this
 * script and the server only listens on this computer. Press Ctrl+C to stop.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync, exec } = require('child_process');

const PORT = 4321;
const root = path.join(__dirname, '..');
const workPath = path.join(root, 'work.json');
const workDir = path.join(root, 'images', 'work');

const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

try {
  git('pull', '--ff-only');
  console.log('Pulled the latest version of the site.');
} catch (e) {
  console.warn('Could not pull the latest version (continuing anyway):\n' + (e.stderr || e.message));
}

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
};

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function safeName(original) {
  const ext = path.extname(original).toLowerCase();
  const base = path.basename(original, path.extname(original))
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  let name = base + ext;
  for (let n = 2; fs.existsSync(path.join(workDir, name)); n++) name = `${base}-${n}${ext}`;
  return name;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (req.method === 'GET' && url.pathname === '/') {
      return send(res, 200, PAGE, 'text/html; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/api/work') {
      return send(res, 200, fs.readFileSync(workPath, 'utf8'));
    }
    if (req.method === 'POST' && url.pathname === '/api/upload') {
      const original = url.searchParams.get('name') || 'project.jpg';
      if (!/\.(jpe?g|png|gif|webp)$/i.test(original)) return send(res, 400, { error: 'Use a JPG, PNG, GIF or WebP image.' });
      const name = safeName(original);
      fs.writeFileSync(path.join(workDir, name), await readBody(req));
      return send(res, 200, { image: `images/work/${name}` });
    }
    if (req.method === 'POST' && url.pathname === '/api/publish') {
      const items = JSON.parse((await readBody(req)).toString('utf8'));
      if (!Array.isArray(items) || items.some(i => !i.title || !i.image)) {
        return send(res, 400, { error: 'Every project needs a title and an image.' });
      }
      fs.writeFileSync(workPath, JSON.stringify(items, null, 2) + '\n');
      execFileSync(process.execPath, [path.join(__dirname, 'image-sizes.js')], { cwd: root, stdio: 'ignore' });
      const used = items.map(i => i.image).filter(p => p.startsWith('images/work/'));
      git('add', 'work.json', ...used);
      if (!git('diff', '--cached', '--name-only').trim()) return send(res, 200, { message: 'Nothing changed, so nothing to publish.' });
      git('commit', '-m', 'Update work grid');
      git('push');
      console.log('Published.');
      return send(res, 200, { message: 'Published. The site updates in a minute or two.' });
    }
    // Everything else: the site's own files (images, fonts, and a local preview at /index.html)
    if (req.method === 'GET') {
      const file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
      if (!file.startsWith(root + path.sep) || file.includes(`${path.sep}.git`)) return send(res, 404, 'Not found', 'text/plain');
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        return send(res, 200, fs.readFileSync(file), types[path.extname(file).toLowerCase()] || 'application/octet-stream');
      }
    }
    send(res, 404, 'Not found', 'text/plain');
  } catch (e) {
    console.error(e.stderr || e.message);
    send(res, 500, { error: String(e.stderr || e.message).trim() });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const link = `http://localhost:${PORT}`;
  console.log(`Work editor running at ${link} (Ctrl+C to stop)`);
  if (!process.env.NO_OPEN) {
    exec(process.platform === 'darwin' ? `open ${link}` : process.platform === 'win32' ? `start ${link}` : `xdg-open ${link}`);
  }
});

const PAGE = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Work editor · The Hideout®</title>
<link rel="icon" href="/images/hideoutlogo.svg" type="image/svg+xml">
<style>
  @font-face { font-family: 'Lastik'; src: url('/fonts/lastik/Lastik-Regular.woff2') format('woff2'); }
  :root { --bg: #000a22; --panel: #0b1531; --line: rgba(255,255,255,.14); --text: #fff; --muted: rgba(255,255,255,.6); --accent: #ffd23f; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.4 'Lastik', Georgia, serif; }
  header { position: sticky; top: 0; z-index: 2; display: flex; gap: 12px; align-items: center; justify-content: space-between;
    padding: 16px 24px; background: var(--bg); border-bottom: 1px solid var(--line); }
  h1 { margin: 0; font-size: 22px; font-weight: 400; }
  .status { color: var(--muted); font-size: 14px; flex: 1; text-align: right; }
  button, .btn { font: inherit; font-size: 15px; padding: 8px 16px; border-radius: 6px; border: 1px solid var(--line);
    background: var(--panel); color: var(--text); cursor: pointer; text-decoration: none; }
  button.primary { background: var(--accent); color: #000a22; border-color: var(--accent); }
  button:disabled { opacity: .5; cursor: default; }
  main { max-width: 760px; margin: 0 auto; padding: 24px; }
  .add { display: flex; gap: 12px; align-items: center; padding: 16px; border: 1px dashed var(--line); border-radius: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .add.drag { border-color: var(--accent); }
  .add input[type=text] { flex: 1; min-width: 180px; }
  input[type=text] { font: inherit; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--line); background: var(--bg); color: var(--text); }
  ol { list-style: none; margin: 0; padding: 0; }
  li { display: flex; gap: 12px; align-items: center; padding: 8px; margin-bottom: 8px; background: var(--panel); border: 1px solid transparent; border-radius: 8px; }
  li.dragging { opacity: .4; }
  li.over { border-color: var(--accent); }
  .handle { cursor: grab; color: var(--muted); font-size: 20px; user-select: none; padding: 0 4px; }
  .num { color: var(--muted); width: 2em; text-align: right; font-size: 14px; }
  li img { width: 64px; height: 64px; object-fit: cover; border-radius: 4px; background: #fff1; }
  li input { flex: 1; min-width: 0; }
  .icon { padding: 6px 10px; }
  .hint { color: var(--muted); font-size: 14px; margin: 0 0 12px; }
</style>
</head>
<body>
<header>
  <h1>Work editor</h1>
  <span class="status" id="status">Loading…</span>
  <a class="btn" href="/index.html" target="_blank">Preview</a>
  <button class="primary" id="publish" disabled>Publish</button>
</header>
<main>
  <form class="add" id="add">
    <input type="file" id="file" accept="image/jpeg,image/png,image/gif,image/webp">
    <input type="text" id="title" placeholder="Project title">
    <button type="submit">Add to top</button>
  </form>
  <p class="hint">Drag to reorder. The top project shows first on the site. Changes stay on this computer until you click Publish.</p>
  <ol id="list"></ol>
</main>
<script>
  let items = [];
  let dirty = false;
  const list = document.getElementById('list');
  const statusEl = document.getElementById('status');
  const publishBtn = document.getElementById('publish');

  function setStatus(text) { statusEl.textContent = text; }
  function markDirty() { dirty = true; publishBtn.disabled = false; setStatus('Unpublished changes'); }

  function render() {
    list.innerHTML = '';
    items.forEach((item, i) => {
      const li = document.createElement('li');
      li.draggable = true;
      li.dataset.index = i;
      li.innerHTML = '<span class="handle" title="Drag to move">⠿</span><span class="num"></span><img alt=""><input type="text">' +
        '<button class="icon" data-move="-1" title="Move up">↑</button><button class="icon" data-move="1" title="Move down">↓</button>' +
        '<button class="icon" data-remove title="Remove from site">✕</button>';
      li.querySelector('.num').textContent = i + 1;
      li.querySelector('img').src = '/' + item.image;
      const input = li.querySelector('input');
      input.value = item.title;
      input.addEventListener('input', () => { item.title = input.value; markDirty(); });
      li.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => move(i, i + Number(b.dataset.move))));
      li.querySelector('[data-remove]').addEventListener('click', () => {
        if (confirm('Remove "' + item.title + '" from the site?')) { items.splice(i, 1); markDirty(); render(); }
      });
      li.addEventListener('dragstart', e => { li.classList.add('dragging'); e.dataTransfer.setData('text/plain', i); });
      li.addEventListener('dragend', () => li.classList.remove('dragging'));
      li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('over'); });
      li.addEventListener('dragleave', () => li.classList.remove('over'));
      li.addEventListener('drop', e => {
        e.preventDefault(); li.classList.remove('over');
        const from = Number(e.dataTransfer.getData('text/plain'));
        if (!Number.isNaN(from)) move(from, i);
      });
      list.appendChild(li);
    });
  }

  function move(from, to) {
    if (to < 0 || to >= items.length || from === to) return;
    const [it] = items.splice(from, 1);
    items.splice(to, 0, it);
    markDirty(); render();
  }

  async function upload(file, title) {
    setStatus('Uploading…');
    const r = await fetch('/api/upload?name=' + encodeURIComponent(file.name), { method: 'POST', body: file });
    const data = await r.json();
    if (!r.ok) { alert(data.error); setStatus(''); return; }
    items.unshift({ title: title || file.name.replace(/\.[^.]+$/, ''), image: data.image });
    markDirty(); render();
  }

  document.getElementById('add').addEventListener('submit', e => {
    e.preventDefault();
    const file = document.getElementById('file').files[0];
    if (!file) { alert('Choose an image first.'); return; }
    upload(file, document.getElementById('title').value.trim());
    e.target.reset();
  });

  const addBox = document.getElementById('add');
  addBox.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); addBox.classList.add('drag'); } });
  addBox.addEventListener('dragleave', () => addBox.classList.remove('drag'));
  addBox.addEventListener('drop', e => {
    addBox.classList.remove('drag');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    e.preventDefault();
    upload(file, document.getElementById('title').value.trim());
    addBox.reset();
  });

  publishBtn.addEventListener('click', async () => {
    publishBtn.disabled = true; setStatus('Publishing…');
    const r = await fetch('/api/publish', { method: 'POST', body: JSON.stringify(items) });
    const data = await r.json();
    if (!r.ok) { alert('Publish failed:\n\n' + data.error); publishBtn.disabled = false; setStatus('Unpublished changes'); return; }
    dirty = false; setStatus(data.message);
    items = await (await fetch('/api/work')).json(); render();
  });

  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  fetch('/api/work').then(r => r.json()).then(data => { items = data; render(); setStatus(items.length + ' projects'); });
</script>
</body>
</html>`;
