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
      <div className="flex min-h-55 items-center justify-center gap-3 text-[13px] text-[#777d90]">
        <span className="inline-block size-5.25 animate-spin rounded-full border-2 border-[#dfe1f5] border-t-[#5b5bd6] motion-reduce:animate-none" />
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
      data-reader-page
      className={
        file
          ? "box-border flex h-[calc(100dvh-66px)] max-h-[calc(100dvh-66px)] min-h-0 w-full flex-col overflow-hidden px-0! py-0! mx-0! max-w-none!"
          : "mx-auto w-[min(1160px,calc(100%-48px))] min-h-[calc(100vh-76px)] pt-10.75 pb-18 max-[767px]:w-[min(calc(100%-32px),600px)] max-[767px]:min-h-[calc(100vh-66px)] max-[767px]:pt-7 max-[767px]:pb-11.5 max-[380px]:w-[calc(100%-24px)]"
      }
    >
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        onChange={onFileInputChange}
        aria-label="Choose a PDF file"
      />
      <div
        className={`flex items-end justify-between gap-6 mb-7.5 max-[767px]:items-start max-[767px]:flex-col max-[767px]:gap-4.25 max-[767px]:mb-5.5 ${file ? "mb-1! flex-row! flex min-h-0 shrink-0 items-center justify-between gap-2! px-2! py-0.5! lg:gap-3!" : ""}`}
      >
        <div className={file ? "hidden" : ""}>
          <Link
            href="/"
            className="mb-3.75 inline-flex items-center gap-1.5 text-xs font-[650] text-[#777d90] hover:text-primary"
          >
            <IconArrowLeft size={16} /> Back home
          </Link>
          <h1 className="m-0 text-[clamp(29px,3.2vw,39px)] leading-[1.15] tracking-[-1.7px]">
            Your reading space
          </h1>
          <p className="mt-2.5 mb-0 text-sm leading-[1.6] text-[#777d90]">
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
          className={`flex shrink-0 items-center gap-2.25 max-[767px]:w-full max-[767px]:*:flex-1 max-[767px]:[&_button]:justify-center ${file ? "w-auto! shrink-0! gap-1! *:flex-none!" : ""}`}
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
        <div
          className="my-3.5 flex items-start gap-2.25 rounded-[13px] border border-[#f2d0d4] bg-[#fff2f3] px-3.5 py-3 text-xs leading-[1.65] text-[#a83d4b] [&>span]:flex-1 [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-inherit [&_button]:cursor-pointer"
          role="alert"
        >
          <IconX size={18} />
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <IconX size={16} />
          </button>
        </div>
      )}
      {notice && (
        <div
          className="my-3.5 flex items-start gap-2.25 rounded-[13px] border border-[#dfe1ff] bg-[#f0f1ff] px-3.5 py-3 text-xs leading-[1.65] text-[#5155a4] [&>span]:flex-1 [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-inherit [&_button]:cursor-pointer"
          role="status"
        >
          <IconLock size={18} />
          <span>{notice}</span>
          <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
            <IconX size={16} />
          </button>
        </div>
      )}
      {!file ? (
        <section className="mx-auto mt-8.75 w-full max-w-190 rounded-[27px] border border-[#e4e6f2] bg-[linear-gradient(145deg,rgb(255_255_255/88%),rgb(255_255_255/65%))] px-7.5 pb-6.75 pt-11.75 text-center shadow-glass backdrop-blur-[18px] max-[767px]:mt-4.5 max-[767px]:rounded-[22px] max-[767px]:px-4.75 max-[767px]:pb-5 max-[767px]:pt-8.75">
          <div className="relative mx-auto mb-6.25 h-25.5 w-27.5">
            <div className="absolute left-3.75 top-1.75 h-19.5 w-15.25 -rotate-12 rounded-[9px] border border-[#dedff1] bg-[#f0f0ff] shadow-[0_8px_20px_rgb(70_74_130/8%)]" />
            <div className="absolute left-8.5 top-1.25 flex h-19.5 w-15.25 rotate-[5deg] flex-col items-center justify-center gap-0.5 rounded-[9px] border border-[#dedff1] bg-[linear-gradient(145deg,#fff,#f7f7ff)] text-[#6565cf] shadow-[0_8px_20px_rgb(70_74_130/8%)] [&>span]:text-[9px] [&>span]:font-extrabold [&>span]:tracking-[1px]">
              <IconFileTypePdf size={38} stroke={1.3} />
              <span>PDF</span>
            </div>
            <div className="absolute bottom-0.5 right-0.5 grid size-10 place-items-center rounded-[14px] border border-[#e7e7fa] bg-white/90 text-[#5656c8] shadow-[0_6px_18px_rgb(70_74_130/9%)]">
              <IconBook2 size={22} />
            </div>
          </div>
          <h2 className="m-0 text-[25px] tracking-[-0.9px] max-[767px]:text-[22px]">
            {busy ? "Opening your book…" : "Bring a book to life."}
          </h2>
          <p className="mx-auto mb-6 mt-2.75 max-w-118.75 text-[13px] leading-[1.8] text-[#7b8092] max-[767px]:text-xs">
            Choose a PDF from your device. It will be rendered locally in your
            browser and won't be uploaded to a server.
          </p>
          <ActionButton
            variant="primary"
            className="mx-auto min-h-12.25! rounded-[15px]! px-4.75! py-3.5! text-sm!"
            onClick={openFile}
            disabled={busy}
          >
            {busy ? (
              <span className="inline-block size-3.75 animate-spin rounded-full border-2 border-[#dfe1f5] border-t-[#5b5bd6] motion-reduce:animate-none" />
            ) : (
              <IconUpload size={19} />
            )}{" "}
            {busy ? "Checking PDF…" : "Choose a PDF"}
          </ActionButton>
          <div className="mt-5 flex items-center justify-center gap-3.25 text-[10px] text-[#858a9b] max-[767px]:flex-wrap max-[767px]:gap-2">
            <span className="inline-flex items-center gap-1.25 [&_svg]:text-[#7b7da7]">
              <IconLock size={15} /> Private by default
            </span>
            <i className="size-0.75 rounded-full bg-[#b7bbca]" />
            <span className="inline-flex items-center gap-1.25">
              PDF up to 100 MB
            </span>
          </div>
          <div className="mt-7.25 flex flex-col gap-1.5 rounded-[14px] border border-[#ebedf6] bg-[rgb(244_245_252/72%)] px-4.25 py-3.75 text-left [&>strong]:text-[11px] [&>strong]:text-[#575d74] [&>span]:text-[11px] [&>span]:leading-[1.65] [&>span]:text-[#81869a]">
            <strong>Good to know</strong>
            <span>
              For privacy, the PDF itself is temporary. History remembers the
              book name and can reopen it when your browser supports saved file
              access.
            </span>
          </div>
        </section>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden border-0! rounded-none! bg-transparent! shadow-none! px-0! pb-0! pt-0!">
          <PdfFlipbook
            file={file}
            initialPage={initialPage}
            onPageCount={onPageCount}
            onPageChange={onPageChange}
          />
          <p className="hidden!">
            <IconLock size={15} /> This PDF is being read locally. Closing the
            reader clears the active session.
          </p>
        </section>
      )}
    </main>
  );
}
