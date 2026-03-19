# Tailwind production setup

This repo now includes the files needed to replace the Tailwind CDN script with a built stylesheet.

## Included files

- `package.json`
- `tailwind.config.js`
- `src/input.css`
- generated `src/output.css` after build

## Install dependencies

```bash
npm install
```

## Build Tailwind

```bash
npm run tailwind:build
```

## Watch Tailwind changes

```bash
npm run tailwind:watch
```

## What changed

- All HTML pages now load `/src/output.css` instead of `https://cdn.tailwindcss.com`.
- Existing repo-owned CSS files such as `css/index.css`, `css/listings.css`, `css/admin.css`, `css/business.css`, `css/pwa.css`, and `css/submit.css` continue to provide the custom styles that are not Tailwind utilities.
- `src/input.css` scans the full repo so the generated stylesheet includes the utilities used across root pages, partials, JS templates, listing pages, and generated listing detail pages.

## Migration workflow on this branch

1. Run `npm install`
2. Run `npm run tailwind:build`
3. Commit both source changes and `src/output.css`
4. Ship one PR from `feat/tailwind-migration`
