# Tailwind CLI setup files prepared in this repo

I added the files Tailwind's CLI quickstart expects so you can run the commands directly:

- `package.json`
- `src/input.css`

## What is already created

### 1) `package.json`
Includes scripts:
- `npm run tailwind:build`
- `npm run tailwind:watch`

### 2) `src/input.css`
Contains:
```css
@import "tailwindcss";
```

## Run the exact Tailwind commands

1. Install dependencies:
```bash
npm install tailwindcss @tailwindcss/cli
```

2. Build once:
```bash
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css
```

3. Watch mode (optional):
```bash
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch
```

## Next manual step after build
In any page you migrate off the CDN, replace:
```html
<script src="https://cdn.tailwindcss.com"></script>
```
with:
```html
<link href="/src/output.css" rel="stylesheet">
```

Do this page-by-page after generating `src/output.css`.
