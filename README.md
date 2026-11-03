# The Hideout®

Static portfolio site for The Hideout Design Co, replacing the Webflow version of thehideout.design. Plain HTML, CSS and a little JavaScript, no build step.

## Pages

- `index.html` is the splash page: client logos, the "Don't tell nobody" marquee and the Enter button.
- `work.html` is the work grid. Projects come from `work.json`, newest first.
- `info.html` is the bio and contact button.

## Run it locally

`work.html` loads `work.json` with `fetch`, so it needs a real server rather than `file://`:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Add a project

1. Drop the image in `images/work/`.
2. Add an entry to the top of `work.json`:
   ```json
   { "title": "Project name", "image": "images/work/your-file.jpg" }
   ```

## Assets

Fonts live in `fonts/` with their `@font-face` rules in `css/styles.css`.

`node download-assets.js` pulls anything missing from the Webflow CDN, including the splash logos, the Enter button and the social share image. It skips files that already exist. Run it before Webflow is cancelled.

## Deploy

Hosted on GitHub Pages from `main`. The `CNAME` file points it at `www.thehideout.design`; DNS needs a `CNAME` record for `www` to `titusmith.github.io` and `A` records for the apex domain to GitHub's Pages IPs.
