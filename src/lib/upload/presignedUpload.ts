import { api } from "@/lib/api/endpoints";

export interface UploadResult {
  publicUrl: string;
  key: string;
}

/**
 * Upload a file via presigned URL flow:
 * 1. POST /storage/presigned-url
 * 2. PUT file to upload_url
 * 3. Return public_url + key
 */
export async function uploadViaPresignedUrl(
  file: File,
  purpose: "kyc" | "product" | "support" | string = "product"
): Promise<UploadResult> {
  const presign = await api.storage.getPresignedUrl({
    file_name: file.name,
    content_type: file.type || "application/octet-stream",
    size: file.size,
    purpose,
  });

  const uploadRes = await fetch(presign.upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed (${uploadRes.status})`);
  }

  return {
    publicUrl: presign.public_url || presign.file_url,
    key: presign.key,
  };
}
