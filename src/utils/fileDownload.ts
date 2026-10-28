/**
 * File Download Utility
 * Ensures that files and photos are downloaded in the exact format (PDF, DOCX, JPG, PNG, WEBP, etc.)
 * in which they were uploaded or stored.
 */

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'text/plain': '.txt',
  'text/csv': '.csv',
};

export interface FileFormatInfo {
  extension: string;
  mimeType: string;
  isImage: boolean;
}

/**
 * Detects the MIME type and file extension from a URL, data URL, and/or original file name.
 */
export function detectFormatInfo(urlOrData?: string, originalFileName?: string): FileFormatInfo {
  const url = (urlOrData || '').trim();
  const name = (originalFileName || '').trim();

  // 1. Try to extract extension from originalFileName if provided
  if (name) {
    const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
    if (extMatch) {
      const ext = `.${extMatch[1].toLowerCase()}`;
      const isImg = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp'].includes(ext);
      let mime = 'application/octet-stream';
      for (const [m, e] of Object.entries(MIME_TO_EXTENSION)) {
        if (e === ext) {
          mime = m;
          break;
        }
      }
      return { extension: ext, mimeType: mime, isImage: isImg };
    }
  }

  // 2. Try to parse Data URL: data:<mime-type>;base64,...
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;,]+)/i);
    if (match) {
      const mime = match[1].toLowerCase();
      const isImg = mime.startsWith('image/');
      const ext = MIME_TO_EXTENSION[mime] || (isImg ? '.jpg' : '.pdf');
      return { extension: ext, mimeType: mime, isImage: isImg };
    }
  }

  // 3. Try to extract extension from URL path
  const urlPathMatch = url.match(/\.([a-zA-Z0-9]+)($|\?)/);
  if (urlPathMatch) {
    const ext = `.${urlPathMatch[1].toLowerCase()}`;
    const isImg = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp'].includes(ext);
    let mime = 'application/octet-stream';
    for (const [m, e] of Object.entries(MIME_TO_EXTENSION)) {
      if (e === ext) {
        mime = m;
        break;
      }
    }
    return { extension: ext, mimeType: mime, isImage: isImg };
  }

  // 4. Check for Unsplash or web image URLs
  if (
    url.includes('images.unsplash.com') ||
    url.includes('format=jpg') ||
    url.includes('format=png') ||
    url.includes('photo-')
  ) {
    if (url.includes('format=png')) {
      return { extension: '.png', mimeType: 'image/png', isImage: true };
    }
    return { extension: '.jpg', mimeType: 'image/jpeg', isImage: true };
  }

  // 5. Default fallback
  return { extension: '.pdf', mimeType: 'application/pdf', isImage: false };
}

/**
 * Constructs a sanitized filename that preserves the uploaded format extension.
 */
export function getSafeDownloadFilename(
  title?: string,
  urlOrData?: string,
  originalFileName?: string
): string {
  const format = detectFormatInfo(urlOrData, originalFileName);
  const ext = format.extension;

  // If originalFileName was provided and has an extension, prefer its base name or extension
  if (originalFileName && originalFileName.trim()) {
    const cleanOrig = originalFileName.trim();
    if (cleanOrig.toLowerCase().endsWith(ext.toLowerCase())) {
      // Use clean original filename if title is empty or generic
      if (!title || title.trim() === 'Document' || title.trim() === 'Download') {
        return cleanOrig.replace(/[<>:"/\\|?*]/g, '_');
      }
    }
  }

  // Sanitize title
  let safeTitle = (title || 'Department_Document')
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_');

  // Strip existing extension if it ends with any recognized extension
  safeTitle = safeTitle.replace(/\.(pdf|docx?|xlsx?|pptx?|jpe?g|png|webp|gif|svg|csv|txt|zip)$/i, '');

  if (!safeTitle) {
    safeTitle = format.isImage ? 'Department_Photo' : 'Department_Document';
  }

  return `${safeTitle}${ext}`;
}

/**
 * Converts a base64 Data URL to a binary Blob.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error('Error converting dataUrl to Blob:', err);
    return new Blob([], { type: 'application/pdf' });
  }
}

import { isGoogleDriveUrl, downloadGoogleDriveFile } from './googleDrive';

/**
 * Downloads a file or photo in its exact original uploaded format.
 */
export async function downloadFile(
  urlOrData: string,
  preferredFilename: string
): Promise<void> {
  if (!urlOrData || urlOrData === '#') {
    console.warn('Cannot download empty file URL');
    return;
  }

  const filename = preferredFilename || 'Department_Download';

  // 1. Google Drive URLs: trigger direct Google Drive export download stream
  if (isGoogleDriveUrl(urlOrData)) {
    downloadGoogleDriveFile(urlOrData, filename);
    return;
  }

  // 2. Convert Data URL to binary Blob URL for reliable native downloading
  if (urlOrData.startsWith('data:')) {
    const blob = dataUrlToBlob(urlOrData);
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    return;
  }

  // 2. Blob URLs can be downloaded directly
  if (urlOrData.startsWith('blob:')) {
    const link = document.createElement('a');
    link.href = urlOrData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 3. For external or local HTTP/HTTPS URLs:
  // Fetch as blob first so the browser strictly respects the download filename and extension
  try {
    const response = await fetch(urlOrData, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch (_err) {
    // Fallback if CORS prevents blob conversion
    const link = document.createElement('a');
    link.href = urlOrData;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

