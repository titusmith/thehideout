# The Hideout®

Static portfolio site for The Hideout Design Co. Built from scratch to replace the Webflow-hosted version.

## Test locally

The work page loads `work.json` via fetch, which requires a real HTTP server (not `file://`).

```bash
cd hideout
npx serve .
```

Then open **http://localhost:3000** in your browser. Or:

```bash
python3 -m http.server 8000
```

Then open **http://localhost:8000**.

## Deploy to GitHub Pages

1. Create a repo on GitHub (e.g. `hideout`).
2. Push this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/hideout.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages**
4. Under **Source**, choose **Deploy from a branch**
5. Branch: **main**, folder: **/ (root)**
6. Save — the site will be at `https://YOUR_USERNAME.github.io/hideout/`
7. For **thehideout.design**: The `CNAME` file is already set. In Pages settings, add the custom domain and follow GitHub’s DNS instructions.

## Assets

- **Fonts**: In `fonts/` — add or replace files, update `@font-face` in `css/styles.css`
- **Images**: Run `node download-assets.js` to fetch from Webflow CDN (run before cancelling Webflow)
