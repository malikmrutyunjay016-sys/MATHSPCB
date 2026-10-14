import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';

export const MAX_SYLLABUS_FILE_BYTES = 500 * 1024; // 500 KB = 512,000 bytes

/**
 * Format bytes to readable string (e.g. 340 KB, 1.2 MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Helper to compress raw JPEG bytes using HTML5 canvas
 */
async function compressJpegBytes(
  jpegBytes: Uint8Array,
  quality = 0.65,
  maxDimension = 1400
): Promise<Uint8Array | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    try {
      const blob = new Blob([jpegBytes as unknown as BlobPart], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Draw with white background in case of transparent background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          async (compressedBlob) => {
            if (!compressedBlob) {
              resolve(null);
              return;
            }
            const arrayBuf = await compressedBlob.arrayBuffer();
            const compressedUint8 = new Uint8Array(arrayBuf);
            if (compressedUint8.length < jpegBytes.length) {
              resolve(compressedUint8);
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Convert an ArrayBuffer / Uint8Array to a base64 Data URL
 */
export function bytesToDataUrl(bytes: Uint8Array, mimeType = 'application/pdf'): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Reads a File into an ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Reads a File into a Data URL
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image file (PNG/JPG/WebP) using Canvas down to target size
 */
export async function compressImageFile(
  file: File,
  targetMaxBytes = MAX_SYLLABUS_FILE_BYTES
): Promise<{ dataUrl: string; sizeBytes: number; wasCompressed: boolean }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Try progressive compression
        const tryQualities = [0.8, 0.65, 0.5, 0.35, 0.2];
        const attempt = (index: number) => {
          if (index >= tryQualities.length) {
            // Take lowest quality
            const dataUrl = canvas.toDataURL('image/jpeg', 0.2);
            const head = 'data:image/jpeg;base64,';
            const size = Math.round(((dataUrl.length - head.length) * 3) / 4);
            resolve({ dataUrl, sizeBytes: size, wasCompressed: true });
            return;
          }

          const quality = tryQualities[index];
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const head = 'data:image/jpeg;base64,';
          const size = Math.round(((dataUrl.length - head.length) * 3) / 4);

          if (size <= targetMaxBytes || index === tryQualities.length - 1) {
            resolve({ dataUrl, sizeBytes: size, wasCompressed: true });
          } else {
            attempt(index + 1);
          }
        };

        attempt(0);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses a PDF file using pdf-lib and stream optimization
 */
export async function compressPdfFile(
  file: File,
  targetMaxBytes = MAX_SYLLABUS_FILE_BYTES
): Promise<{ dataUrl: string; sizeBytes: number; wasCompressed: boolean }> {
  const originalBuffer = await readFileAsArrayBuffer(file);

  try {
    const pdfDoc = await PDFDocument.load(originalBuffer, { ignoreEncryption: true });

    // 1. Remove unnecessary metadata & thumbnail caches
    try {
      const catalog = pdfDoc.catalog;
      if (catalog.has(PDFName.of('Metadata'))) {
        catalog.delete(PDFName.of('Metadata'));
      }
      if (catalog.has(PDFName.of('Thumb'))) {
        catalog.delete(PDFName.of('Thumb'));
      }
    } catch {
      // Continue even if catalog cleanup fails
    }

    // 2. Pass 1: Save with object streams
    let savedBytes = await pdfDoc.save({ useObjectStreams: true });

    if (savedBytes.length <= targetMaxBytes) {
      const dataUrl = bytesToDataUrl(savedBytes, 'application/pdf');
      return {
        dataUrl,
        sizeBytes: savedBytes.length,
        wasCompressed: true,
      };
    }

    // 3. Pass 2: If still > target, compress embedded JPEG image streams
    let imagesCompressed = 0;
    try {
      for (const [ref, obj] of pdfDoc.context.enumerateIndirectObjects()) {
        if (obj instanceof PDFRawStream) {
          const dict = obj.dict;
          const subtype = dict.get(PDFName.of('Subtype'));
          const filter = dict.get(PDFName.of('Filter'));

          // Check if it's an Image with DCTDecode (JPEG)
          if (
            subtype === PDFName.of('Image') &&
            filter === PDFName.of('DCTDecode')
          ) {
            const rawBytes = obj.getContents();
            if (rawBytes.length > 50 * 1024) {
              // Image > 50 KB, compress it
              const compressedImg = await compressJpegBytes(rawBytes, 0.55, 1200);
              if (compressedImg && compressedImg.length < rawBytes.length) {
                const newStream = PDFRawStream.of(dict, compressedImg);
                pdfDoc.context.assign(ref, newStream);
                imagesCompressed++;
              }
            }
          }
        }
      }
    } catch {
      // Ignore image pass errors and proceed
    }

    if (imagesCompressed > 0) {
      savedBytes = await pdfDoc.save({ useObjectStreams: true });
    }

    // 4. Pass 3: If still > target and images exist, aggressive pass
    if (savedBytes.length > targetMaxBytes) {
      try {
        for (const [ref, obj] of pdfDoc.context.enumerateIndirectObjects()) {
          if (obj instanceof PDFRawStream) {
            const dict = obj.dict;
            const subtype = dict.get(PDFName.of('Subtype'));
            const filter = dict.get(PDFName.of('Filter'));

            if (
              subtype === PDFName.of('Image') &&
              filter === PDFName.of('DCTDecode')
            ) {
              const rawBytes = obj.getContents();
              if (rawBytes.length > 25 * 1024) {
                const compressedImg = await compressJpegBytes(rawBytes, 0.35, 900);
                if (compressedImg && compressedImg.length < rawBytes.length) {
                  const newStream = PDFRawStream.of(dict, compressedImg);
                  pdfDoc.context.assign(ref, newStream);
                }
              }
            }
          }
        }
        savedBytes = await pdfDoc.save({ useObjectStreams: true });
      } catch {
        // Continue
      }
    }

    const dataUrl = bytesToDataUrl(savedBytes, 'application/pdf');
    return {
      dataUrl,
      sizeBytes: savedBytes.length,
      wasCompressed: true,
    };
  } catch (err) {
    console.warn('PDF compression error, falling back to original:', err);
    const dataUrl = await readFileAsDataUrl(file);
    return {
      dataUrl,
      sizeBytes: file.size,
      wasCompressed: false,
    };
  }
}

export interface ProcessSyllabusResult {
  success: boolean;
  dataUrl?: string;
  fileName: string;
  sizeBytes: number;
  sizeStr: string;
  originalSizeBytes: number;
  originalSizeStr: string;
  wasCompressed: boolean;
  compressionRatio?: number; // percentage saved (e.g. 42%)
  errorMessage?: string;
}

/**
 * Main processor for Menu -> Syllabus file upload
 * Strictly enforces the 500 KB limit, compressing the file if needed.
 */
export async function processSyllabusFile(
  file: File,
  targetMaxBytes = MAX_SYLLABUS_FILE_BYTES
): Promise<ProcessSyllabusResult> {
  const originalSizeBytes = file.size;
  const originalSizeStr = formatBytes(originalSizeBytes);

  const isPdf =
    file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
  const isImage =
    file.type.startsWith('image/') ||
    /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!isPdf && !isImage) {
    return {
      success: false,
      fileName: file.name,
      sizeBytes: originalSizeBytes,
      sizeStr: originalSizeStr,
      originalSizeBytes,
      originalSizeStr,
      wasCompressed: false,
      errorMessage: 'Please upload a PDF document format (.pdf) or syllabus document image.',
    };
  }

  // 1. If file is already <= 500 KB, no compression is needed!
  if (originalSizeBytes <= targetMaxBytes) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      success: true,
      dataUrl,
      fileName: file.name,
      sizeBytes: originalSizeBytes,
      sizeStr: originalSizeStr,
      originalSizeBytes,
      originalSizeStr,
      wasCompressed: false,
    };
  }

  // 2. File exceeds 500 KB: Compress the file!
  try {
    let result: { dataUrl: string; sizeBytes: number; wasCompressed: boolean };

    if (isPdf) {
      result = await compressPdfFile(file, targetMaxBytes);
    } else {
      result = await compressImageFile(file, targetMaxBytes);
    }

    const compressedSizeStr = formatBytes(result.sizeBytes);
    const percentageSaved = Math.max(
      0,
      Math.round(((originalSizeBytes - result.sizeBytes) / originalSizeBytes) * 100)
    );

    // Check if the compressed file fits within 500 KB
    if (result.sizeBytes <= targetMaxBytes) {
      return {
        success: true,
        dataUrl: result.dataUrl,
        fileName: file.name,
        sizeBytes: result.sizeBytes,
        sizeStr: compressedSizeStr,
        originalSizeBytes,
        originalSizeStr,
        wasCompressed: true,
        compressionRatio: percentageSaved,
      };
    } else {
      // Even after compression, file is larger than 500 KB
      return {
        success: false,
        dataUrl: result.dataUrl,
        fileName: file.name,
        sizeBytes: result.sizeBytes,
        sizeStr: compressedSizeStr,
        originalSizeBytes,
        originalSizeStr,
        wasCompressed: true,
        compressionRatio: percentageSaved,
        errorMessage: `File exceeds the 500 KB upload limit. Original: ${originalSizeStr}. After compression: ${compressedSizeStr}. Please select a smaller PDF under 500 KB or provide a link in the "Provide Link in URL" tab.`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      fileName: file.name,
      sizeBytes: originalSizeBytes,
      sizeStr: originalSizeStr,
      originalSizeBytes,
      originalSizeStr,
      wasCompressed: false,
      errorMessage: `Could not compress file: ${err?.message || 'Compression error'}. Please choose a file under 500 KB or provide a syllabus URL link.`,
    };
  }
}
