export type LocalFileHandle = {
  getFile: () => Promise<File>;
  queryPermission?: (options: { mode: "read" }) => Promise<PermissionState>;
  requestPermission?: (options: { mode: "read" }) => Promise<PermissionState>;
};

export type PdfHistoryEntry = {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  lastOpened: number;
  handle?: LocalFileHandle;
};

const DB_NAME = "folio-reading-library";
const STORE_NAME = "pdfs";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("Local browser storage is unavailable."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open the local library."));
  });
}

export async function getPdfHistory(): Promise<PdfHistoryEntry[]> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction
        .objectStore(STORE_NAME)
        .getAll() as IDBRequest<PdfHistoryEntry[]>;
      request.onsuccess = () =>
        resolve(request.result.sort((a, b) => b.lastOpened - a.lastOpened));
      request.onerror = () =>
        reject(request.error ?? new Error("Could not read the local library."));
    });
  } finally {
    database.close();
  }
}

export async function savePdfHistory(entry: PdfHistoryEntry): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(entry);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ?? new Error("Could not save reading history."),
        );
      transaction.onabort = () =>
        reject(
          transaction.error ?? new Error("Saving reading history was aborted."),
        );
    });
  } finally {
    database.close();
  }
}

export async function removePdfHistory(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ?? new Error("Could not remove the history entry."),
        );
      transaction.onabort = () =>
        reject(
          transaction.error ??
            new Error("Removing the history entry was aborted."),
        );
    });
  } finally {
    database.close();
  }
}

export function createHistoryId(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

export async function clearPdfHistory(): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ?? new Error("Could not clear reading history."),
        );
      transaction.onabort = () =>
        reject(
          transaction.error ??
            new Error("Clearing reading history was aborted."),
        );
    });
  } finally {
    database.close();
  }
}
