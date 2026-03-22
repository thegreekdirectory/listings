# Cloudflare image upload worker

This repo includes the upload proxy worker at `workers/yellow-shape-dcd5.js`.

## Required runtime configuration

The deployed worker must have these environment values configured:

- `CF_ACCOUNT_ID`: the Cloudflare account that owns your Images setup.
- `CF_API_TOKEN`: an API token with permission to upload/manage Cloudflare Images for that account.

If either value is missing, the worker now returns:

```json
{
  "success": false,
  "errors": [
    { "message": "Worker is missing CF_ACCOUNT_ID or CF_API_TOKEN." }
  ]
}
```

## Expected upload flow

The browser sends a `multipart/form-data` POST containing:

- `file`
- `id`

The worker forwards both to:

`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`

## Quick manual test

Replace the placeholders below and run:

```bash
curl --request POST https://tgd-images-upload.thegreekdirectory.org/ \
  --form "file=@/path/to/test-image.webp" \
  --form "id=123-logo-2026-03-22-a"
```

If deployment is correct, the response should be JSON with `success: true`.

If the response is `401`, check:

1. `CF_API_TOKEN` is present on the deployed worker.
2. The token belongs to the same account as `CF_ACCOUNT_ID`.
3. The token has Cloudflare Images upload/write permissions.
