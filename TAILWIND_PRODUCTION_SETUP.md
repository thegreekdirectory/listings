# TailwindCSS Production Setup Plan (Recommended Method: Tailwind CLI)

For this project, the **Tailwind CLI** approach is the best fit because the codebase is static HTML + vanilla JS (no existing Vite/PostCSS bundler pipeline).

## Why this method fits
1. No framework lock-in.
2. Minimal tooling overhead.
3. Easy to generate one production CSS file and remove CDN runtime dependency.

## Manual steps
1. Install Tailwind tooling:
   ```bash
   npm install -D tailwindcss @tailwindcss/cli
   ```
2. Create `tailwind.config.js` with `content` globs for all HTML/JS templates.
3. Create a source stylesheet (for example `css/tailwind.input.css`) containing:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
4. Build production CSS:
   ```bash
   npx tailwindcss -i ./css/tailwind.input.css -o ./css/tailwind.css --minify
   ```
5. Replace every `<script src="https://cdn.tailwindcss.com"></script>` with:
   ```html
   <link rel="stylesheet" href="/css/tailwind.css">
   ```
6. Add an npm script for rebuilds (example in `package.json`):
   ```json
   {
     "scripts": {
       "build:tailwind": "tailwindcss -i ./css/tailwind.input.css -o ./css/tailwind.css --minify"
     }
   }
   ```
7. Run a full UI regression pass on:
   - listings index
   - listing detail template output
   - business portal
   - admin portal

## Notes
- This keeps Tailwind in production-safe mode (precompiled CSS, no CDN runtime).
- If you share the exact Tailwind docs snippet you referenced, I can align file names/commands 1:1 to that doc section.
