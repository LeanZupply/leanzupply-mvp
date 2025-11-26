import { supabase } from "@/integrations/supabase/client";

/**
 * Normalize a stored file url or path to an internal storage path under product-docs
 * Accepts:
 *  - Full public URL
 *  - Signed URL
 *  - Relative path with or without leading bucket
 */
export function normalizeProductDocPath(input: string): string | null {
  if (!input) return null;
  try {
    // If full URL, extract everything after '/product-docs/'
    const idx = input.indexOf('/product-docs/');
    if (idx !== -1) {
      return input.substring(idx + '/product-docs/'.length);
    }
    // If already starts with bucket id, strip it
    if (input.startsWith('product-docs/')) {
      return input.replace('product-docs/', '');
    }
    // Treat as path already
    return input.replace(/^\/+/, '');
  } catch {
    return null;
  }
}

export async function getSignedUrl(path: string, expiresInSeconds = 60 * 60): Promise<string | null> {
  const clean = normalizeProductDocPath(path);
  if (!clean) return null;
  const { data, error } = await supabase.storage
    .from('product-docs')
    .createSignedUrl(clean, expiresInSeconds);
  if (error) {
    console.error('[storage] Error creating signed URL', error);
    return null;
  }
  return data?.signedUrl ?? null;
}

export async function uploadProductFile(productId: string, file: File): Promise<{ filePath: string; signedUrl: string | null }> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${productId}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('product-docs')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: signed } = await supabase.storage
    .from('product-docs')
    .createSignedUrl(filePath, 60 * 60);

  return { filePath, signedUrl: signed?.signedUrl ?? null };
}

/**
 * Open a file from product-docs in a new tab using a signed URL.
 * Falls back to fetching the blob if the browser/extension blocks the URL.
 */
export async function openFileInNewTab(path: string): Promise<string | null> {
  try {
    const url = await getSignedUrl(path);
    if (!url) return null;

    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      // Fallback: fetch blob and open via object URL (avoids some blockers)
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to fetch signed file');
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      return blobUrl;
    }

    return url;
  } catch (err) {
    console.error('[storage] openFileInNewTab error', err);
    return null;
  }
}

/**
 * Force a download of a file from product-docs using a signed URL.
 */
export async function downloadFile(path: string, filename?: string): Promise<boolean> {
  try {
    const url = await getSignedUrl(path);
    if (!url) return false;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Failed to fetch signed file');
    const blob = await resp.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || (normalizeProductDocPath(path)?.split('/').pop() || 'document');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    return true;
  } catch (err) {
    console.error('[storage] downloadFile error', err);
    return false;
  }
}
