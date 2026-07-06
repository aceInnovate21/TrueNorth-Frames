// Browser-side image compression. Runs entirely in the client before a
// presigned direct-to-R2 upload, so large originals never hit a serverless
// function (Vercel's 4.5 MB body limit) and no server CPU is spent.
//
// Pipeline: [HEIC→JPEG if needed] → decode (EXIF-oriented) → downscale → WebP.

export interface CompressedImage {
  blob: Blob
  contentType: 'image/webp'
  ext: 'webp'
  width: number
  height: number
}

const HEIC_RE = /\.(heic|heif)$/i

function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || HEIC_RE.test(file.name)
}

async function loadDrawable(
  blob: Blob
): Promise<{ img: CanvasImageSource; width: number; height: number; cleanup: () => void }> {
  // Preferred: createImageBitmap honours EXIF orientation via imageOrientation.
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' } as ImageBitmapOptions)
      return { img: bmp, width: bmp.width, height: bmp.height, cleanup: () => bmp.close?.() }
    } catch {
      /* fall through to <img> */
    }
  }
  // Fallback for browsers without createImageBitmap.
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('decode failed'))
      el.src = url
    })
    return {
      img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      cleanup: () => URL.revokeObjectURL(url),
    }
  } catch {
    URL.revokeObjectURL(url)
    throw new Error('Could not read this image. Please try a different file.')
  }
}

async function heicToJpeg(file: File): Promise<Blob> {
  try {
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    return Array.isArray(converted) ? converted[0] : converted
  } catch {
    throw new Error('Could not read this HEIC image. Please export it as JPG and try again.')
  }
}

export async function compressImageToWebp(
  file: File,
  opts?: { maxDim?: number; quality?: number }
): Promise<CompressedImage> {
  const maxDim = opts?.maxDim ?? 2048
  const quality = opts?.quality ?? 0.82

  // Try the browser's native decoder FIRST. This is the fast path for JPEG/PNG/
  // WebP everywhere, and for HEIC on WebKit (iOS Safari + all iOS browsers, and
  // desktop Safari) — so the iPhone-majority audience never pays the WASM cost.
  // Only when native decode fails on a real HEIC (desktop Chrome/Firefox) do we
  // fall back to the heic2any WASM decoder.
  let drawable: Awaited<ReturnType<typeof loadDrawable>>
  try {
    drawable = await loadDrawable(file)
  } catch (nativeErr) {
    if (isHeic(file)) {
      drawable = await loadDrawable(await heicToJpeg(file))
    } else {
      throw nativeErr instanceof Error ? nativeErr : new Error('Could not read this image.')
    }
  }

  const { img, width, height, cleanup } = drawable
  try {
    const scale = Math.min(1, maxDim / Math.max(width, height || 1))
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round((height || 1) * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Image processing is not supported in this browser.')
    ctx.drawImage(img, 0, 0, w, h)

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/webp', quality)
    )
    if (!blob) throw new Error('Could not process this image. Please try a different file.')

    return { blob, contentType: 'image/webp', ext: 'webp', width: w, height: h }
  } finally {
    cleanup()
  }
}
