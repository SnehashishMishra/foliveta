"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconFileTypePdf,
  IconHistory,
  IconLock,
  IconUpload,
  IconX,
  IconCloudUpload,
  IconFileCheck,
} from "@tabler/icons-react";
import { ActionButton } from "@/components/ui/action-button";
import { usePdfSession } from "@/features/reader/pdf-session-provider";
import {
  getBook,
  rememberBook,
  updateBookProgress,
} from "@/lib/storage/history-db";
import { formatBytes, validatePdfFile } from "@/lib/pdf/file-utils";
import type { LocalFileHandle, WindowWithFilePicker } from "@/types/book";

const PdfFlipbook = dynamic(
  () =>
    import("@/features/reader/pdf-flipbook").then(
      (module) => module.PdfFlipbook,
    ),
  {
    ssr: false,
    // Do not replace the reader with a full-surface loading message. The reader component
    // stays mounted during page navigation; this fallback is only for the initial chunk.
    loading: () => null,
  },
);

export function ReaderClient() {
  const { session, setSession, clearSession } = usePdfSession();
  const [file, setFile] = useState<File | null>(session?.file ?? null);
  const [historyId, setHistoryId] = useState<string | undefined>(
    session?.historyId,
  );
  const [initialPage, setInitialPage] = useState(session?.lastPage ?? 1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingHistoryId, setPendingHistoryId] = useState<
    string | undefined
  >();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.file) {
      setFile(session.file);
      setHistoryId(session.historyId);
      setInitialPage(session.lastPage ?? 1);
    }
  }, [session]);

  useEffect(() => {
    const requestedHistoryId = new URLSearchParams(window.location.search).get(
      "history",
    );
    if (requestedHistoryId) {
      setPendingHistoryId(requestedHistoryId);
      setNotice(
        "Choose the original PDF to reopen this history item. The app does not keep a copy of the PDF.",
      );
    }
  }, []);

  const loadFile = useCallback(
    async (selectedFile: File, selectedHandle?: LocalFileHandle) => {
      setBusy(true);
      setError("");
      setNotice("");
      const validationError = await validatePdfFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setBusy(false);
        return;
      }

      let savedId = pendingHistoryId;
      let savedPage = 1;
      let preferredId = pendingHistoryId;
      if (preferredId) {
        try {
          const previousRecord = await getBook(preferredId);
          if (
            previousRecord &&
            (previousRecord.fileName !== selectedFile.name ||
              previousRecord.size !== selectedFile.size)
          ) {
            preferredId = undefined;
            setNotice(
              "This file differs from the saved book, so it will be added as a separate history item.",
            );
          }
        } catch {
          preferredId = undefined;
        }
      }
      try {
        const record = await rememberBook(
          selectedFile,
          selectedHandle,
          preferredId,
        );
        savedId = record.id;
        savedPage = record.lastPage ?? 1;
      } catch {
        setNotice(
          "The PDF is ready, but this browser could not save reading history.",
        );
      }

      setFile(selectedFile);
      setHistoryId(savedId);
      setInitialPage(savedPage);
      setPendingHistoryId(undefined);
      setSession({
        file: selectedFile,
        handle: selectedHandle,
        historyId: savedId,
        lastPage: savedPage,
      });
      setBusy(false);
    },
    [pendingHistoryId, setSession],
  );

  const openFile = useCallback(async () => {
    setError("");
    const pickerWindow = window as WindowWithFilePicker;
    if (pickerWindow.showOpenFilePicker) {
      try {
        const handles = await pickerWindow.showOpenFilePicker({
          multiple: false,
          excludeAcceptAllOption: true,
          types: [
            {
              description: "PDF documents",
              accept: { "application/pdf": [".pdf"] },
            },
          ],
        });
        const selectedHandle = handles[0];
        if (!selectedHandle) return;
        await loadFile(await selectedHandle.getFile(), selectedHandle);
        return;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError")
          return;
      }
    }
    inputRef.current?.click();
  }, [loadFile]);

  const onFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    event.target.value = "";
    if (!selectedFiles?.length) return;
    if (selectedFiles.length !== 1) {
      setError("Choose one PDF at a time.");
      return;
    }
    await loadFile(selectedFiles[0]);
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length !== 1) {
      setError(
        droppedFiles.length === 0
          ? "Drop one PDF file here."
          : "Please drop one PDF at a time.",
      );
      return;
    }
    await loadFile(droppedFiles[0]);
  };

  const onPageCount = useCallback(
    (pageCount: number) => {
      if (historyId) void updateBookProgress(historyId, { pageCount });
    },
    [historyId],
  );

  const onPageChange = useCallback(
    (pageNumber: number) => {
      if (historyId)
        void updateBookProgress(historyId, { lastPage: pageNumber });
    },
    [historyId],
  );

  const closeBook = () => {
    setFile(null);
    setHistoryId(undefined);
    clearSession();
    setError("");
    setNotice("");
  };

  return (
    <main
      className={`reader-page mx-auto flex w-full max-w-[1600px] flex-col overflow-hidden px-3 py-2 sm:px-5 sm:py-3 lg:px-7 ${file ? "reader-page-active" : "reader-page-upload"}`}
    >
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        multiple={false}
        onChange={onFileInputChange}
        aria-label="Choose one PDF file"
      />
      <div className="reader-heading mb-2 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="Back home"
          >
            <IconArrowLeft size={18} />
          </Link>
          <h1 className="truncate text-xl font-extrabold tracking-[-0.045em] sm:text-2xl">
            Your reading space
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/history"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white/75 px-3.5 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <IconHistory size={17} /> History
          </Link>
          {file && (
            <ActionButton onClick={openFile} variant="primary">
              <IconUpload size={17} /> Replace book
            </ActionButton>
          )}
        </div>
      </div>

      {error && (
        <div
          className="mb-2 flex shrink-0 items-start gap-2 rounded-xl border border-destructive/20 bg-red-50 px-3 py-2 text-sm text-[#a93847]"
          role="alert"
        >
          <IconX size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            className="rounded-lg p-1 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <IconX size={16} />
          </button>
        </div>
      )}
      {notice && (
        <div
          className="mb-2 flex shrink-0 items-start gap-2 rounded-xl border border-primary/15 bg-accent/60 px-3 py-2 text-sm text-accent-foreground"
          role="status"
        >
          <IconLock size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button
            className="rounded-lg p-1 hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="Dismiss notice"
            onClick={() => setNotice("")}
          >
            <IconX size={16} />
          </button>
        </div>
      )}

      {!file ? (
        <section className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col justify-center overflow-y-auto rounded-2xl border border-white/90 bg-white/75 p-4 shadow-glass backdrop-blur-2xl sm:p-6">
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null,
                )
              )
                setIsDragging(false);
            }}
            onDrop={(event) => void onDrop(event)}
            className={`relative flex min-h-70 flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed px-4 py-5 text-center transition-colors sm:min-h-75 sm:px-8 ${isDragging ? "border-primary bg-accent/70" : "border-[#d9dcef] bg-linear-to-b from-white/80 to-[#f7f7ff]/70 hover:border-primary/50 hover:bg-accent/20"}`}
            role="region"
            aria-label="PDF upload drop zone"
          >
            <div
              className={`mb-6 grid size-20 place-items-center rounded-[1.7rem] border border-[#e4e5fb] bg-linear-to-br from-white to-accent text-primary shadow-[0_12px_30px_rgba(91,91,214,0.12)] transition-transform ${isDragging ? "scale-105" : ""}`}
            >
              <IconCloudUpload size={38} stroke={1.4} />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tighter sm:text-3xl">
              {isDragging
                ? "Drop your PDF here"
                : busy
                  ? "Opening your book…"
                  : "Bring a book to life."}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
              Drag and drop one PDF from your device, or choose a file manually.
              It is opened locally in your browser, not uploaded to a server.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
              <ActionButton
                variant="primary"
                className="min-h-12 rounded-2xl px-5"
                onClick={openFile}
                disabled={busy}
              >
                {busy ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
                ) : (
                  <IconUpload size={19} />
                )}{" "}
                {busy ? "Checking PDF…" : "Choose a PDF"}
              </ActionButton>
              <span className="text-xs text-muted-foreground">
                or drag it into this area
              </span>
            </div>
            {busy && (
              <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-primary/10">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
              </div>
            )}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <IconLock size={15} /> Private by default
              </span>
              <span className="hidden size-1 rounded-full bg-border sm:block" />
              <span className="inline-flex items-center gap-1.5">
                <IconFileCheck size={15} /> One valid PDF only
              </span>
              <span className="hidden size-1 rounded-full bg-border sm:block" />
              <span>Up to 100 MB</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="reader-book-shell flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/90 bg-white/65 p-1 shadow-glass backdrop-blur-2xl sm:p-1.5">
          <div className="mb-1 flex min-w-0 shrink-0 items-center gap-2 rounded-lg border border-border/70 bg-white/80 px-2 py-1 sm:px-2.5 sm:py-1.5">
            <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-primary">
              <IconFileTypePdf size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="truncate text-sm font-bold sm:text-base"
                title={file.name}
              >
                {file.name}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {formatBytes(file.size)} · Local file
              </p>
            </div>
            <ActionButton
              variant="ghost"
              className="size-8 shrink-0 p-0!"
              onClick={closeBook}
              aria-label="Close current book"
              title="Close book"
            >
              <IconX size={19} />
            </ActionButton>
          </div>
          <PdfFlipbook
            file={file}
            initialPage={initialPage}
            onPageCount={onPageCount}
            onPageChange={onPageChange}
          />
        </section>
      )}
    </main>
  );
}
