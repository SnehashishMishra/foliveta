export interface LocalFileHandle {
  readonly kind: "file";
  readonly name: string;
  getFile(): Promise<File>;
  queryPermission?: (descriptor: { mode: "read" }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: "read" }) => Promise<PermissionState>;
}

export interface BookRecord {
  id: string;
  title: string;
  fileName: string;
  size: number;
  lastModified: number;
  lastOpenedAt: number;
  pageCount?: number;
  lastPage?: number;
  handle?: LocalFileHandle;
}

export interface PdfSession {
  file: File;
  handle?: LocalFileHandle;
  historyId?: string;
  lastPage?: number;
}

export interface OpenFilePickerOptions {
  multiple?: boolean;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
}

export interface WindowWithFilePicker extends Window {
  showOpenFilePicker?: (
    options?: OpenFilePickerOptions,
  ) => Promise<LocalFileHandle[]>;
}
