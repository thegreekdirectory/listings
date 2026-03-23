# Cloudflare Images upload worker

This worker powers listing image uploads for the admin portal, business portal, and submission form.

## Expected multipart fields

- `file`: WEBP image payload
- `listingId`: numeric listing/request ID
- `assetType`: `logo` or `photo`
- `source`: `a`, `b`, or `s`

## Response

```json
{
  "success": true,
  "customImageId": "123-logo-2026-03-23-a-abc12",
  "url": "https://images.thegreekdirectory.org/cdn-cgi/imagedelivery/rheV007PEt08HUYXNuJLnQ/123-logo-2026-03-23-a-abc12/public"
}
```

## Required environment variables

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_IMAGES_API_TOKEN`
