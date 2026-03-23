(function (global) {
  const ACCOUNT_HASH = 'rheV007PEt08HUYXNuJLnQ';
  const CANONICAL_HOST = 'https://images.thegreekdirectory.org';
  const VARIANT = 'public';
  const DEFAULT_UPLOAD_ENDPOINT = 'https://tgd-images-upload.thegreekdirectory.org';
  const VALID_ASSET_TYPES = ['logo', 'photo'];
  const VALID_SOURCES = ['a', 'b', 's'];
  const CUSTOM_ID_REGEX = /^\d+-(logo|photo)-\d{4}-\d{2}-\d{2}-[abs]-[a-z0-9]{5}$/;


  function buildCanonicalImageUrl(customImageId) {
    return `${CANONICAL_HOST}/cdn-cgi/imagedelivery/${ACCOUNT_HASH}/${customImageId}/${VARIANT}`;
  }

  function normalizeCustomImageUploadResponse(payload) {
    if (typeof payload === 'string') {
      return {
        success: true,
        customImageId: null,
        url: payload
      };
    }

    const customImageId = payload?.customImageId || payload?.result?.id || payload?.id || null;
    const variants = Array.isArray(payload?.result?.variants) ? payload.result.variants : [];
    const url = payload?.url || payload?.result?.url || payload?.result?.delivery_url || variants[0] || (customImageId ? buildCanonicalImageUrl(customImageId) : '');

    return {
      success: payload?.success !== false,
      customImageId,
      url
    };
  }

  function parseNumericListingId(listingId) {
    const value = String(listingId ?? '').trim();
    if (!/^\d+$/.test(value)) {
      throw new Error('A numeric listing/request ID is required before uploading images.');
    }
    return value;
  }

  function validateAssetType(assetType) {
    if (!VALID_ASSET_TYPES.includes(assetType)) {
      throw new Error(`Unsupported asset type: ${assetType || 'unknown'}.`);
    }
    return assetType;
  }

  function validateSource(source) {
    if (!VALID_SOURCES.includes(source)) {
      throw new Error(`Unsupported upload source: ${source || 'unknown'}.`);
    }
    return source;
  }

  async function convertFileToWebp(file, options = {}) {
    if (!file) {
      throw new Error('No file was provided.');
    }

    if (file.type === 'image/webp') {
      return file;
    }


    if (typeof createImageBitmap === 'function') {
      const imageBitmap = await createImageBitmap(file);
      const canvas = typeof OffscreenCanvas === 'function'
        ? new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
        : null;

      if (canvas) {
        const context = canvas.getContext('2d');
        context.drawImage(imageBitmap, 0, 0);
        const blob = await canvas.convertToBlob({ type: 'image/webp', quality: options.quality ?? 0.92 });
        imageBitmap.close?.();
        return new File([blob], replaceExtension(file.name, 'webp'), {
          type: 'image/webp',
          lastModified: Date.now()
        });
      }

      imageBitmap.close?.();
    }

    if (typeof document === 'undefined') {
      throw new Error('WEBP conversion is unavailable in this environment.');
    }

    const bitmap = await loadImageElement(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.naturalWidth || bitmap.width;
    canvas.height = bitmap.naturalHeight || bitmap.height;
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
          return;
        }
        reject(new Error('Unable to convert the selected image to WEBP.'));
      }, 'image/webp', options.quality ?? 0.92);
    });

    return new File([blob], replaceExtension(file.name, 'webp'), {
      type: 'image/webp',
      lastModified: Date.now()
    });
  }

  function loadImageElement(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Unsupported image format. Please choose a raster image file.'));
      };
      image.src = objectUrl;
    });
  }

  function replaceExtension(name, nextExtension) {
    const baseName = String(name || 'upload').replace(/\.[^.]+$/, '') || 'upload';
    return `${baseName}.${nextExtension}`;
  }

  async function uploadListingImage({ file, listingId, assetType, source, endpoint }) {
    const normalizedListingId = parseNumericListingId(listingId);
    const normalizedAssetType = validateAssetType(assetType);
    const normalizedSource = validateSource(source);
    const uploadEndpoint = String(endpoint || DEFAULT_UPLOAD_ENDPOINT).trim() || DEFAULT_UPLOAD_ENDPOINT;

    const webpFile = await convertFileToWebp(file);
    const formData = new FormData();
    formData.append('file', webpFile, webpFile.name);
    formData.append('listingId', normalizedListingId);
    formData.append('assetType', normalizedAssetType);
    formData.append('source', normalizedSource);

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      if (!response.ok) {
        throw new Error('Upload failed. The server returned an unreadable response.');
      }
    }

    const normalized = normalizeCustomImageUploadResponse(payload);
    if (!response.ok || !normalized.success || !normalized.url) {
      const message = payload?.error || payload?.errors?.[0]?.message || payload?.message || 'Upload failed.';
      throw new Error(message);
    }

    return normalized;
  }

  const api = {
    ACCOUNT_HASH,
    CANONICAL_HOST,
    VARIANT,
    DEFAULT_UPLOAD_ENDPOINT,
    VALID_ASSET_TYPES,
    VALID_SOURCES,
    CUSTOM_ID_REGEX,
    buildCanonicalImageUrl,
    convertFileToWebp,
    normalizeCustomImageUploadResponse,
    parseNumericListingId,
    uploadListingImage,
    validateAssetType,
    validateSource
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.TGDCloudflareImages = api;
})(typeof window !== 'undefined' ? window : globalThis);
