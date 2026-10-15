"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import {
  IconArrowLeft,
  IconBook2,
  IconFileTypePdf,
  IconHistory,
  IconLock,
  IconUpload,
  IconX,
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
    loading: () => (
      <div className="reader-loading">
        <span className="loading-spinner" />
        <p>Preparing your reading space…</p>
      </div>
    ),
  },
);
export function ReaderClient() {
  const { session, setSession } = usePdfSession();
  const [file, setFile] = useState<File | null>(session?.file ?? null);
  const [historyId, setHistoryId] = useState<string | undefined>(
    session?.historyId,
  );
  const [initialPage, setInitialPage] = useState(session?.lastPage ?? 1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingHistoryId, setPendingHistoryId] = useState<
    string | undefined
  >();
  const inputRef = useRef<HTMLInputElement>(null);
  const bookNameContainerRef = useRef<HTMLDivElement>(null);
  const bookNameMeasureRef = useRef<HTMLSpanElement>(null);
  const [bookNameOverflows, setBookNameOverflows] = useState(false);

  useEffect(() => {
    const container = bookNameContainerRef.current;
    const measure = bookNameMeasureRef.current;
    if (!file || !container || !measure) {
      setBookNameOverflows(false);
      return;
    }

    const updateOverflow = () => {
      setBookNameOverflows(measure.scrollWidth > container.clientWidth);
    };

    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(container);
    return () => observer.disconnect();
  }, [file?.name]);
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
        "This browser cannot reopen that saved file automatically. Choose the same PDF to continue.",
      );
    }
  }, []);
  const loadFile = useCallback(
    async (selectedFile: File, selectedHandle?: LocalFileHandle) => {
      setBusy(true);
      setError("");
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
    setNotice("");
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
        const selectedFile = await selectedHandle.getFile();
        await loadFile(selectedFile, selectedHandle);
        return;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError")
          return;
        // Some browsers expose the API but deny it; fall back to a normal file input.
      }
    }
    inputRef.current?.click();
  }, [loadFile]);
  const onFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (selectedFile) await loadFile(selectedFile);
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
  return (
    <main
      className={`reader-page ${file ? "box-border flex h-[calc(100dvh-66px)] max-h-[calc(100dvh-66px)] min-h-0 w-full flex-col overflow-hidden px-0! py-0! mx-0! max-w-none!" : "shell"}`}
    >
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="application/pdf,.pdf"
        onChange={onFileInputChange}
        aria-label="Choose a PDF file"
      />
      <div
        className={`reader-heading-row ${file ? "mb-1! flex-row! flex min-h-0 shrink-0 items-center justify-between gap-2! px-2! py-0.5! lg:gap-3!" : ""}`}
      >
        <div className={file ? "hidden" : ""}>
          <Link href="/" className="back-link">
            <IconArrowLeft size={16} /> Back home
          </Link>
          <h1 className="page-title">Your reading space</h1>
          <p className="page-subtitle">
            A calm place for the books you already own.
          </p>
        </div>
        {file && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 mt-1">
              <IconFileTypePdf className="shrink-0 text-indigo-600" size={18} />
              <div
                ref={bookNameContainerRef}
                className="relative min-w-0 flex-1"
              >
                <h2
                  className="truncate text-xs font-semibold leading-tight text-slate-800"
                  title={file.name}
                >
                  <span className="hidden sm:inline">{file.name}</span>
                  <span className="sm:hidden">
                    {bookNameOverflows ? (
                      <Marquee speed={35} gradient={false} pauseOnHover>
                        <span className="mr-12 whitespace-nowrap">
                          {file.name}
                        </span>
                      </Marquee>
                    ) : (
                      file.name
                    )}
                  </span>
                </h2>
                <span
                  ref={bookNameMeasureRef}
                  className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap text-xs font-semibold leading-tight"
                  aria-hidden="true"
                >
                  {file.name}
                </span>
                <p className="hidden truncate text-[10px] leading-tight text-slate-500 sm:block">
                  {formatBytes(file.size)} · Open in this browser only
                </p>
              </div>
            </div>
          </div>
        )}
        <div
          className={`reader-top-actions ${file ? "w-auto! shrink-0! gap-1! *:flex-none!" : ""}`}
        >
          {file && (
            <ActionButton
              onClick={openFile}
              variant="primary"
              className="h-6! min-h-7! px-2! py-1! text-[10px]! cursor-pointer"
            >
              <IconUpload size={15} /> Replace book
            </ActionButton>
          )}
        </div>
      </div>
      {error && (
        <div className="notice notice-error" role="alert">
          <IconX size={18} />
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <IconX size={16} />
          </button>
        </div>
      )}
      {notice && (
        <div className="notice notice-info" role="status">
          <IconLock size={18} />
          <span>{notice}</span>
          <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
            <IconX size={16} />
          </button>
        </div>
      )}
      {!file ? (
        <section className="upload-card glass-panel">
          <div className="upload-art">
            <div className="upload-art-sheet sheet-back" />
            <div className="upload-art-sheet sheet-front">
              <IconFileTypePdf size={38} stroke={1.3} />
              <span>PDF</span>
            </div>
            <div className="upload-art-sparkle">
              <IconBook2 size={22} />
            </div>
          </div>
          <h2>{busy ? "Opening your book…" : "Bring a book to life."}</h2>
          <p>
            Choose a PDF from your device. It will be rendered locally in your
            browser and won't be uploaded to a server.
          </p>
          <ActionButton
            variant="primary"
            className="button-large"
            onClick={openFile}
            disabled={busy}
          >
            {busy ? (
              <span className="loading-spinner spinner-small" />
            ) : (
              <IconUpload size={19} />
            )}{" "}
            {busy ? "Checking PDF…" : "Choose a PDF"}
          </ActionButton>
          <div className="upload-meta">
            <span>
              <IconLock size={15} /> Private by default
            </span>
            <i />
            <span>PDF up to 100 MB</span>
          </div>
          <div className="upload-tip">
            <strong>Good to know</strong>
            <span>
              For privacy, the PDF itself is temporary. History remembers the
              book name and can reopen it when your browser supports saved file
              access.
            </span>
          </div>
        </section>
      ) : (
        <section className="active-reader-section flex min-h-0 flex-1 flex-col overflow-hidden border-0! rounded-none! bg-transparent! shadow-none! px-0! pb-0! pt-0!">
          <PdfFlipbook
            file={file}
            initialPage={initialPage}
            onPageCount={onPageCount}
            onPageChange={onPageChange}
          />
          <p className="reader-privacy-line hidden!">
            <IconLock size={15} /> This PDF is being read locally. Closing the
            reader clears the active session.
          </p>
        </section>
      )}
    </main>
  );
}
