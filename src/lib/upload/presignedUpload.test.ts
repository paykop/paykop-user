import { describe, expect, it, vi, beforeEach } from "vitest";
import { uploadViaPresignedUrl } from "@/lib/upload/presignedUpload";

vi.mock("@/lib/api/endpoints", () => ({
  api: {
    storage: {
      getPresignedUrl: vi.fn(),
    },
  },
}));

import { api } from "@/lib/api/endpoints";

describe("uploadViaPresignedUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("presigns, uploads, and returns public URL + key", async () => {
    vi.mocked(api.storage.getPresignedUrl).mockResolvedValue({
      upload_url: "https://storage.example/upload",
      public_url: "https://cdn.example/kyc/doc.pdf",
      key: "kyc/doc.pdf",
      file_url: "https://cdn.example/kyc/doc.pdf",
    });
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);

    const file = new File(["data"], "doc.pdf", { type: "application/pdf" });
    const result = await uploadViaPresignedUrl(file, "kyc");

    expect(api.storage.getPresignedUrl).toHaveBeenCalledWith({
      file_name: "doc.pdf",
      content_type: "application/pdf",
      size: file.size,
      purpose: "kyc",
    });
    expect(global.fetch).toHaveBeenCalledWith("https://storage.example/upload", {
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      body: file,
    });
    expect(result).toEqual({
      publicUrl: "https://cdn.example/kyc/doc.pdf",
      key: "kyc/doc.pdf",
    });
  });

  it("throws when PUT upload fails", async () => {
    vi.mocked(api.storage.getPresignedUrl).mockResolvedValue({
      upload_url: "https://storage.example/upload",
      public_url: "https://cdn.example/img.jpg",
      key: "img.jpg",
      file_url: "https://cdn.example/img.jpg",
    });
    vi.mocked(global.fetch).mockResolvedValue({ ok: false, status: 403 } as Response);

    const file = new File(["x"], "img.jpg", { type: "image/jpeg" });
    await expect(uploadViaPresignedUrl(file, "product")).rejects.toThrow("Upload failed (403)");
  });

  it("supports purpose: return for evidence uploads", async () => {
    vi.mocked(api.storage.getPresignedUrl).mockResolvedValue({
      upload_url: "https://storage.example/upload-return",
      public_url: "https://cdn.example/return/u123/evidence.jpg",
      key: "return/u123/evidence.jpg",
      file_url: "https://cdn.example/return/u123/evidence.jpg",
    });
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);

    const file = new File(["evidence-data"], "evidence.jpg", { type: "image/jpeg" });
    const res = await uploadViaPresignedUrl(file, "return");

    expect(api.storage.getPresignedUrl).toHaveBeenCalledWith({
      file_name: "evidence.jpg",
      content_type: "image/jpeg",
      size: file.size,
      purpose: "return",
    });
    expect(res.key).toBe("return/u123/evidence.jpg");
    expect(res.publicUrl).toBe("https://cdn.example/return/u123/evidence.jpg");
  });
});
