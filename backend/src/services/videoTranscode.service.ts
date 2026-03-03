import fs from 'fs';
import path from 'path';

/**
 * Lightweight integration with an external video streaming provider (e.g. Cloudflare Stream).
 *
 * The goal is:
 * - Upload raw video once
 * - Let the provider handle transcoding/compression (e.g. max 720p, adaptive bitrate)
 * - Store only a small playback URL in our database
 *
 * This file is intentionally provider-agnostic but currently implements Cloudflare Stream
 * because it gives us:
 * - Automatic HLS/DASH
 * - On-the-fly bitrate/resolution adaptation
 *
 * Environment variables required (if using Cloudflare Stream):
 * - CLOUDFLARE_STREAM_ACCOUNT_ID
 * - CLOUDFLARE_STREAM_API_TOKEN (with Stream:Edit permission)
 *
 * If env vars are missing, this module will gracefully fall back and skip external upload.
 */

export interface TranscodedVideoInfo {
  /** Public playback URL (HLS). */
  playbackUrl: string;
  /** ID of the asset at the provider (for future management). */
  providerAssetId: string;
  /** Name of the provider, useful for debugging. */
  provider: 'cloudflare';
}

function isCloudflareConfigured(): boolean {
  return !!process.env.CLOUDFLARE_STREAM_ACCOUNT_ID && !!process.env.CLOUDFLARE_STREAM_API_TOKEN;
}

/**
 * Upload a local video file to Cloudflare Stream.
 *
 * Cloudflare will:
 * - Ingest the original file
 * - Transcode it to streaming formats (including 720p+adaptive bitrate)
 * - Host and stream the content for us
 *
 * We then store only the playback URL in our DB.
 */
export async function uploadVideoToCloudflare(
  localFilePath: string,
  originalFilename: string
): Promise<TranscodedVideoInfo | null> {
  if (!isCloudflareConfigured()) {
    console.warn(
      'Cloudflare Stream not configured. Skipping external video upload for:',
      originalFilename
    );
    return null;
  }

  const accountId = process.env.CLOUDFLARE_STREAM_ACCOUNT_ID!;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

  const stats = fs.statSync(localFilePath);
  if (!stats.isFile()) {
    console.warn('uploadVideoToCloudflare: local file does not exist or is not a file:', localFilePath);
    return null;
  }

  const fileStream = fs.createReadStream(localFilePath);

  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`;

  // Node 20+ has global fetch; we stream the body directly.
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/octet-stream',
      'Tus-Resumable': '1.0.0',
      'Upload-Name': Buffer.from(path.basename(originalFilename)).toString('base64'),
    },
    // @ts-ignore - Node's fetch accepts a Readable as body
    body: fileStream,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('Cloudflare Stream upload failed:', response.status, text);
    return null;
  }

  const json = (await response.json()) as any;

  if (!json?.success || !json?.result?.uid) {
    console.error('Cloudflare Stream upload response missing uid:', json);
    return null;
  }

  const uid = json.result.uid as string;

  // Standard Cloudflare Stream public playback URL (HLS).
  const playbackUrl = `https://videodelivery.net/${uid}/manifest/video.m3u8`;

  console.log('✅ Video uploaded to Cloudflare Stream:', {
    uid,
    playbackUrl,
    size: stats.size,
  });

  return {
    playbackUrl,
    providerAssetId: uid,
    provider: 'cloudflare',
  };
}

