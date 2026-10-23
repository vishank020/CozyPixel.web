export type DownloadResult = "saved" | "opened";

/**
 * Downloads a file through a blob so it saves with its own name (a plain link to another
 * origin would just open the image). Reports progress as a 0–1 fraction when the server
 * sends Content-Length, otherwise null. If fetching fails, opens the file in a new tab.
 */
export async function downloadImage(
  url: string,
  filename: string,
  onProgress?: (fraction: number | null) => void
): Promise<DownloadResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const total = Number(response.headers.get("content-length")) || 0;
    let blob: Blob;

    if (response.body && total > 0) {
      const reader = response.body.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;
      onProgress?.(0);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        onProgress?.(Math.min(received / total, 1));
      }
      blob = new Blob(chunks, { type: response.headers.get("content-type") ?? "" });
    } else {
      onProgress?.(null);
      blob = await response.blob();
    }

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a moment to start the save before releasing the blob
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return "saved";
  } catch (err) {
    console.error("Download failed, falling back to new tab.", err);
    window.open(url, "_blank", "noopener");
    return "opened";
  }
}
