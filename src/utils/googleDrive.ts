/**
 * Utility for detecting, embedding, and downloading Google Drive and Google Docs links.
 */

/**
 * Extracts Google Drive or Google Docs File/Document ID from various URL formats.
 * e.g.
 * - https://drive.google.com/file/d/1A2B3C4D5E6F/view?usp=sharing
 * - https://drive.google.com/open?id=1A2B3C4D5E6F
 * - https://drive.google.com/uc?id=1A2B3C4D5E6F
 * - https://docs.google.com/document/d/1A2B3C4D5E6F/edit
 * - https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F/edit
 * - https://docs.google.com/presentation/d/1A2B3C4D5E6F/edit
 */
export function extractGoogleDriveFileId(url?: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // 1. Check for /d/FILE_ID pattern
  const matchD = cleanUrl.match(/\/(?:file|document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchD && matchD[1]) {
    return matchD[1];
  }

  // 2. Check for id=FILE_ID parameter
  const matchId = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchId && matchId[1]) {
    return matchId[1];
  }

  return null;
}

/**
 * Checks if a given string is a Google Drive or Google Docs URL.
 */
export function isGoogleDriveUrl(url?: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.includes('drive.google.com') ||
    clean.includes('docs.google.com') ||
    clean.includes('drive.usercontent.google.com')
  );
}

/**
 * Returns Google Drive preview URL suitable for embedding inside an <iframe>.
 * e.g. https://drive.google.com/file/d/FILE_ID/preview
 */
export function getGoogleDriveEmbedUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return url;
}

/**
 * Returns Google Drive direct download URL.
 * e.g. https://drive.google.com/uc?export=download&id=FILE_ID
 */
export function getGoogleDriveDirectDownloadUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
}

/**
 * Triggers a direct download for a Google Drive file.
 * Opens the export download stream in a seamless link or temporary window.
 */
export function downloadGoogleDriveFile(url: string, preferredFilename?: string): void {
  const fileId = extractGoogleDriveFileId(url);
  const directDownloadUrl = fileId
    ? `https://drive.google.com/uc?export=download&id=${fileId}`
    : url;

  const filename = preferredFilename || 'Google_Drive_Document.pdf';

  // Create temporary invisible link to trigger browser download prompt directly
  const link = document.createElement('a');
  link.href = directDownloadUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
