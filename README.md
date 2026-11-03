# The Hideout®

Static portfolio site for The Hideout Design Co, replacing the Webflow version of thehideout.design. Plain HTML, CSS and a little JavaScript, no build step.

## Pages

- `index.html` is the home page and work grid. Projects come from `work.json`, newest first.
- `work.html` only redirects old `/work` links to the home page.
- `info.html` is the bio and contact button.

## Run it locally

`index.html` loads `work.json` with `fetch`, so it needs a real server rather than `file://`:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Add or reorder projects

The work grid is built from `work.json`. The top entry shows first.

### With the editor (easiest)

1. Go to [app.pagescms.org](https://app.pagescms.org), sign in with GitHub, and open **titusmith/thehideout**. The first time, it asks to install the Pages CMS app on the repo; allow it.
2. Click **Work** in the sidebar. Every project is listed in order.
3. **Add:** click **Add an entry**, type a title, upload the image, then drag the new entry to where you want it (usually the top).
4. **Reorder:** drag entries up or down.
5. **Remove:** use the entry's menu to delete it.
6. Click **Save**. The site updates in a minute or two.

After each save, the "Image sizes" GitHub Action records the new image's width and height in `work.json`, so it holds its spot in the grid while loading. You don't need to do anything for that.

### By hand

1. Drop the image in `images/work/`.
2. Add an entry to `work.json` where you want it to appear:
   ```json
   { "title": "Project name", "image": "images/work/your-file.jpg" }
   ```
3. Commit to `main`. The Image sizes Action fills in the width and height, or run `node scripts/image-sizes.js` yourself.

## Assets

Fonts live in `fonts/` with their `@font-face` rules in `css/styles.css`.

`node download-assets.js` pulls anything missing from the Webflow CDN, including the splash logos, the Enter button and the social share image. It skips files that already exist. Run it before Webflow is cancelled.

## Deploy

Hosted on GitHub Pages from `main`. The `CNAME` file points it at `www.thehideout.design`; DNS needs a `CNAME` record for `www` to `titusmith.github.io` and `A` records for the apex domain to GitHub's Pages IPs.
