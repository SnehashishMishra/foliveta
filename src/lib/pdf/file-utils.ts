export const MAX_PDF_BYTES = 100 * 1024 * 1024;

export async function validatePdfFile(file: File): Promise<string | null> {
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_PDF_BYTES) return "This PDF exceeds the 100 MB limit.";

  const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const signature = new TextDecoder().decode(header);

  if (!hasPdfExtension && file.type !== "application/pdf") {
    return "Choose a PDF file to open.";
  }
  if (signature !== "%PDF-") {
    return "This file does not look like a valid PDF. Please choose another file.";
  }

  return null;
}

export function titleFromFileName(fileName: string): string {
  return (
    fileName
      .replace(/\.pdf$/i, "")
      .replace(/[._]+/g, " ")
      .trim() || "Untitled book"
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}
