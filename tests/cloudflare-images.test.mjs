import test from 'node:test';
import assert from 'node:assert/strict';
import helperModule from '../js/cloudflare-images.js';
import { buildCustomImageId, validateUploadFields } from '../workers/cloudflare-images-upload-worker.mjs';

const cloudflareImages = helperModule;

function createWebpFile(name = 'sample.webp') {
  return new File([Uint8Array.from([82, 73, 70, 70])], name, { type: 'image/webp' });
}

test('worker builds the required custom image ID format and canonical URL', () => {
  const customImageId = buildCustomImageId({
    listingId: '123',
    assetType: 'logo',
    source: 'a',
    date: new Date('2026-03-23T12:00:00Z'),
    randomSuffix: 'abc12'
  });

  assert.equal(customImageId, '123-logo-2026-03-23-a-abc12');
  assert.match(customImageId, cloudflareImages.CUSTOM_ID_REGEX);
  assert.equal(
    cloudflareImages.buildCanonicalImageUrl(customImageId),
    'https://images.thegreekdirectory.org/cdn-cgi/imagedelivery/rheV007PEt08HUYXNuJLnQ/123-logo-2026-03-23-a-abc12/public'
  );
});

test('worker rejects invalid fields and non-WEBP uploads', () => {
  assert.equal(
    validateUploadFields({ file: createWebpFile(), listingId: '55', assetType: 'photo', source: 's' }),
    null
  );
  assert.equal(
    validateUploadFields({ file: new File(['x'], 'sample.png', { type: 'image/png' }), listingId: '55', assetType: 'photo', source: 's' }),
    'Only WEBP images are accepted.'
  );
  assert.equal(
    validateUploadFields({ file: createWebpFile(), listingId: 'abc', assetType: 'photo', source: 's' }),
    'listingId must be a numeric value.'
  );
});

test('shared uploader sends the standardized worker payload for every portal flow', async () => {
  const expectedScenarios = [
    { listingId: '101', assetType: 'logo', source: 'a' },
    { listingId: '101', assetType: 'photo', source: 'a' },
    { listingId: '202', assetType: 'logo', source: 'b' },
    { listingId: '202', assetType: 'photo', source: 'b' },
    { listingId: '303', assetType: 'logo', source: 's' },
    { listingId: '303', assetType: 'photo', source: 's' }
  ];

  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (_url, options) => {
    requests.push(options.body);
    return {
      ok: true,
      async json() {
        const formData = options.body;
        const customImageId = `${formData.get('listingId')}-${formData.get('assetType')}-2026-03-23-${formData.get('source')}-abc12`;
        return {
          success: true,
          customImageId,
          url: cloudflareImages.buildCanonicalImageUrl(customImageId)
        };
      }
    };
  };

  try {
    for (const scenario of expectedScenarios) {
      const response = await cloudflareImages.uploadListingImage({
        file: createWebpFile(`${scenario.assetType}.webp`),
        endpoint: 'https://example.com/upload',
        ...scenario
      });

      assert.match(response.customImageId, cloudflareImages.CUSTOM_ID_REGEX);
      assert.match(response.url, /\/public$/);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requests.length, expectedScenarios.length);
  requests.forEach((formData, index) => {
    const scenario = expectedScenarios[index];
    assert.equal(formData.get('listingId'), scenario.listingId);
    assert.equal(formData.get('assetType'), scenario.assetType);
    assert.equal(formData.get('source'), scenario.source);
    assert.equal(formData.get('file').type, 'image/webp');
  });
});
