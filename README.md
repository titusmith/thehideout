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

The editor runs only on your computer. It isn't part of the website, so nobody else can reach it.

1. In Terminal: `cd ~/hideout` then `node scripts/admin.js`. Your browser opens the editor.
2. **Add:** choose an image (or drag one onto the box), type a title, click **Add to top**.
3. **Reorder:** drag projects, or use the ↑ ↓ buttons. The top project shows first.
4. **Edit or remove:** change a title in place, or click ✕ to take a project off the site.
5. Click **Preview** to see the grid locally, then **Publish**. The site updates in a minute or two.
6. Press Ctrl+C in Terminal when you're done.

### From the terminal

In Terminal, from the site folder (`cd ~/hideout`):

```bash
node scripts/add-project.js ~/Desktop/poster.jpg "Project title"
```

That copies the image into `images/work/`, puts the project at the top of the grid, and publishes it. To reorder, open `work.json` in a text editor, move entries up or down (top shows first), save, then run `git commit -am "Reorder work" && git push`.

## Assets

Fonts live in `fonts/` with their `@font-face` rules in `css/styles.css`.

`node download-assets.js` pulls anything missing from the Webflow CDN, including the splash logos, the Enter button and the social share image. It skips files that already exist. Run it before Webflow is cancelled.

## Deploy

Hosted on GitHub Pages from `main`. The `CNAME` file points it at `www.thehideout.design`; DNS needs a `CNAME` record for `www` to `titusmith.github.io` and `A` records for the apex domain to GitHub's Pages IPs.
