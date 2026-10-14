import type { BookRecord, LocalFileHandle } from "@/types/book";
import { titleFromFileName } from "@/lib/pdf/file-utils";

const DB_NAME = "folio-reader";
const DB_VERSION = 1;
const STORE_NAME = "books";
let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Browser storage is only available in the browser."),
    );
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open local history."));
    request.onblocked = () =>
      reject(new Error("Local history is blocked by another open tab."));
  });
  return databasePromise;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Local storage request failed."));
  });
}

export async function listBooks(): Promise<BookRecord[]> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readonly");
  const records = await requestResult(
    tx.objectStore(STORE_NAME).getAll() as IDBRequest<BookRecord[]>,
  );
  return records.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

export async function getBook(id: string): Promise<BookRecord | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readonly");
  return requestResult(
    tx.objectStore(STORE_NAME).get(id) as IDBRequest<BookRecord | undefined>,
  );
}

async function putRecord(record: BookRecord): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(record);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("Could not save local history."));
    tx.onabort = () =>
      reject(tx.error ?? new Error("Saving local history was cancelled."));
  });
}

export async function rememberBook(
  file: File,
  handle?: LocalFileHandle,
  preferredId?: string,
): Promise<BookRecord> {
  const existing = await listBooks();
  const match = preferredId
    ? existing.find((book) => book.id === preferredId)
    : existing.find(
        (book) =>
          book.fileName === file.name &&
          book.size === file.size &&
          book.lastModified === file.lastModified,
      );

  const record: BookRecord = {
    id: match?.id ?? preferredId ?? crypto.randomUUID(),
    title: titleFromFileName(file.name),
    fileName: file.name,
    size: file.size,
    lastModified: file.lastModified,
    lastOpenedAt: Date.now(),
    pageCount: match?.pageCount,
    lastPage: match?.lastPage,
    ...(handle ? { handle } : match?.handle ? { handle: match.handle } : {}),
  };

  try {
    await putRecord(record);
    return record;
  } catch (error) {
    // Some browsers cannot structured-clone file handles into IndexedDB.
    if (!record.handle) throw error;
    const withoutHandle: BookRecord = { ...record };
    delete withoutHandle.handle;
    await putRecord(withoutHandle);
    return withoutHandle;
  }
}

export async function updateBookProgress(
  id: string,
  progress: { pageCount?: number; lastPage?: number },
): Promise<void> {
  const current = await getBook(id);
  if (!current) return;
  await putRecord({ ...current, ...progress, lastOpenedAt: Date.now() });
}

export async function removeBook(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("Could not remove this history item."));
    tx.onabort = () =>
      reject(tx.error ?? new Error("Removing this item was cancelled."));
  });
}

export async function clearBooks(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("Could not clear local history."));
    tx.onabort = () =>
      reject(tx.error ?? new Error("Clearing history was cancelled."));
  });
}
