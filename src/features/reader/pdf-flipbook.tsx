"use client";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import {
  IconBook2,
  IconChevronLeft,
  IconChevronRight,
  IconFileText,
  IconMaximize,
  IconMinimize,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import { ActionButton } from "@/components/ui/action-button";
// Keep the worker URL static so it is served from /public and matches pdfjs-dist.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
type FlipPageProps = {
  pageNumber: number;
  width: number;
  isRendered: boolean;
};
const FlipPage = forwardRef<HTMLDivElement, FlipPageProps>(function FlipPage(
  { pageNumber, width, isRendered },
  ref,
) {
  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden border border-[#e8e7e1] bg-white shadow-[inset_0_0_24px_rgba(45,48,68,0.025)]"
      data-density="soft"
    >
      {isRendered ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          suspense={false}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          onRenderError={(error) => {
            console.error(`[PDF] Page ${pageNumber} failed to render:`, error);
          }}
          loading={
            <div
              className="h-full w-full animate-pulse bg-slate-50"
              aria-label={`Loading page ${pageNumber}`}
            />
          }
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center bg-slate-50 text-slate-300"
          aria-hidden="true"
        >
          <IconFileText size={24} stroke={1.3} />
        </div>
      )}
      <span
        className="absolute bottom-2 right-3 z-10 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-400"
        aria-hidden="true"
      >
        {pageNumber}
      </span>
    </div>
  );
});
interface PdfFlipbookProps {
  file: File;
  onPageCount: (pageCount: number) => void;
  onPageChange: (pageNumber: number) => void;
  initialPage?: number;
}
type FlipApi = {
  flipNext: () => void;
  flipPrev: () => void;
  flip: (page: number) => void;
  getCurrentPageIndex: () => number;
};
type FlipBookHandle = {
  pageFlip: () => FlipApi | undefined;
};
type FlipEvent = { data: number | string };
const PAGE_ASPECT = 1.43;
export function PdfFlipbook({
  file,
  onPageCount,
  onPageChange,
  initialPage = 1,
}: PdfFlipbookProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, initialPage - 1),
  );
  const [pageInput, setPageInput] = useState(String(Math.max(1, initialPage)));
  const [isMobile, setIsMobile] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 900, height: 500 });
  const [singlePage, setSinglePage] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [bookReady, setBookReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<FlipBookHandle | null>(null);
  useEffect(() => {
    setNumPages(0);
    setCurrentIndex(Math.max(0, initialPage - 1));
    setPageInput(String(Math.max(1, initialPage)));
    setBookReady(false);
    setZoom(1);
    setPdfError("");
  }, [file, initialPage]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    let wasMobile = media.matches;
    const update = () => {
      const nextMobile = media.matches;
      setIsMobile(nextMobile);
      if (nextMobile !== wasMobile) {
        setSinglePage(nextMobile);
        wasMobile = nextMobile;
      }
    };
    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const width = Math.max(320, Math.floor(entry.contentRect.width));
      const height = Math.max(240, Math.floor(entry.contentRect.height));
      setStageSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [numPages, isFullscreen, isPseudoFullscreen]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Keyboard navigation remains available at every zoom level. Pointer and
      // touch page-turn gestures are disabled separately while the PDF is zoomed.
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) {
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const flipbook = bookRef.current?.pageFlip?.();
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        flipbook?.flipNext?.();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        flipbook?.flipPrev?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoom]);
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);
  const handleDocumentLoad = useCallback(
    ({ numPages: count }: { numPages: number }) => {
      setNumPages(count);
      const restoredIndex = Math.min(Math.max(0, initialPage - 1), count - 1);
      setCurrentIndex(restoredIndex);
      setPageInput(String(restoredIndex + 1));
      setPdfError("");
      onPageCount(count);
    },
    [initialPage, onPageCount],
  );
  const handleFlip = useCallback(
    (event: FlipEvent) => {
      const index =
        typeof event.data === "number" ? event.data : Number(event.data);
      if (!Number.isFinite(index) || index < 0) return;
      setCurrentIndex(index);
      setPageInput(String(index + 1));
      onPageChange(index + 1);
    },
    [onPageChange],
  );
  const handleBookInit = useCallback(() => {
    setBookReady(true);
  }, []);
  const getFlipApi = useCallback(() => {
    try {
      return bookRef.current?.pageFlip?.();
    } catch {
      return undefined;
    }
  }, []);
  const goToPage = useCallback(
    (targetIndex: number) => {
      if (!numPages) return;
      const safeIndex = Math.max(0, Math.min(numPages - 1, targetIndex));
      const flipbook = getFlipApi();
      if (flipbook && typeof flipbook.flip === "function") {
        flipbook.flip(safeIndex);
      } else {
        // Avoid throwing while react-pageflip is mounting.
        setPageInput(String(currentIndex + 1));
      }
    },
    [currentIndex, getFlipApi, numPages],
  );
  const turnPrevious = useCallback(() => {
    if (currentIndex <= 0) return;
    getFlipApi()?.flipPrev?.();
  }, [currentIndex, getFlipApi]);
  const turnNext = useCallback(() => {
    if (currentIndex >= numPages - 1) return;
    getFlipApi()?.flipNext?.();
  }, [currentIndex, getFlipApi, numPages]);
  const commitPageInput = useCallback(() => {
    const requested = Number.parseInt(pageInput, 10);
    if (!Number.isFinite(requested)) {
      setPageInput(String(currentIndex + 1));
      return;
    }
    goToPage(requested - 1);
  }, [currentIndex, goToPage, pageInput]);
  const toggleFullscreen = useCallback(async () => {
    const target = containerRef.current;
    if (!target) return;
    if (isPseudoFullscreen) {
      setIsPseudoFullscreen(false);
      return;
    }
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else {
        setIsPseudoFullscreen(true);
      }
    } catch {
      setIsPseudoFullscreen(true);
    }
  }, [isPseudoFullscreen]);
  const fullscreenActive = isFullscreen || isPseudoFullscreen;
  const isSingle = isMobile || singlePage;
  const isZoomed = zoom > 1;
  // Fit the unzoomed book to the available stage. Zoom changes the scrollable
  // surface, not the stage dimensions, so it cannot expand the page layout.
  const stageWidth = Math.max(160, stageSize.width);
  const stageHeight = Math.max(160, stageSize.height);
  // The edge navigation buttons overlay the page area, so reserve no side gutters.
  // Fit the PDF to whichever is tighter: the available width or available height.
  const fitWidth = Math.min(
    isSingle ? stageWidth - 4 : (stageWidth - 8) / 2,
    stageHeight / PAGE_ASPECT,
  );
  const pageWidth = Math.max(120, Math.floor(fitWidth));
  const pageHeight = Math.round(pageWidth * PAGE_ASPECT);
  const bookWidth = pageWidth * (isSingle ? 1 : 2);
  const scaledBookWidth = Math.round(bookWidth * zoom);
  const scaledBookHeight = Math.round(pageHeight * zoom);
  const firstVisible = Math.max(0, currentIndex - 2);
  const lastVisible = Math.min(numPages - 1, currentIndex + 4);
  return (
    <div
      ref={containerRef}
      className={`relative flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden overscroll-none ${fullscreenActive ? "fixed inset-0 z-9999 bg-[#f7f8fc] p-1 sm:p-2" : ""}`}
    >
      {fullscreenActive && (
        <div className="mb-1 flex w-full shrink-0 items-center gap-2">
          <span className="truncate">{file.name}</span>
        </div>
      )}
      {pdfError && (
        <div
          className="mb-2 shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {pdfError}
        </div>
      )}
      <Document
        file={file}
        className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
        suspense={false}
        onLoadSuccess={handleDocumentLoad}
        onLoadError={(error) => {
          console.error("[PDF] Document load failed:", error);
          setPdfError(error.message || "This PDF could not be loaded.");
        }}
        onSourceError={(error) => {
          console.error("[PDF] File source failed:", error);
          setPdfError(error.message || "Could not read the selected PDF.");
        }}
        loading={
          <div className="flex min-h-40 flex-1 items-center justify-center gap-3 text-sm text-slate-500">
            <span className="size-5 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600 motion-reduce:animate-none" />
            <p>Reading your PDF…</p>
          </div>
        }
        error={
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center text-slate-500">
            <IconFileText size={28} />
            <h3 className="text-base font-semibold text-slate-800">
              We couldn&apos;t open this PDF.
            </h3>
            <p className="max-w-sm text-xs leading-6">
              Check the browser console for the underlying error.
            </p>
          </div>
        }
      >
        {numPages > 0 && (
          <div
            ref={stageRef}
            className="relative flex min-h-0 min-w-0 flex-1 items-stretch justify-center overflow-hidden px-0 py-0 contain-[layout_paint]"
          >
            {!isMobile && (
              <ActionButton
                variant="secondary"
                className="absolute left-0 top-1/2 z-50 hidden size-9 min-h-9 -translate-y-1/2 rounded-full! p-0! shadow-md md:flex! md:ml-10 cursor-pointer"
                onClick={turnPrevious}
                disabled={!bookReady || currentIndex <= 0}
                aria-label="Previous page"
              >
                <IconChevronLeft size={22} />
              </ActionButton>
            )}
            <div
              ref={scrollViewportRef}
              className={`relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] contain-[layout_paint] ${isZoomed ? "touch-pan-x touch-pan-y" : "touch-auto"}`}
            >
              <div
                className={`relative flex min-h-full min-w-full w-[max(var(--stage-width),var(--scaled-book-width))] h-[max(var(--stage-height),var(--scaled-book-height))] ${scaledBookHeight < stageSize.height ? "items-center" : "items-start"} ${scaledBookWidth < stageSize.width ? "justify-center" : "justify-start"}`}
                style={
                  {
                    "--stage-width": `${stageSize.width}px`,
                    "--stage-height": `${stageSize.height}px`,
                    "--scaled-book-width": `${scaledBookWidth}px`,
                    "--scaled-book-height": `${scaledBookHeight}px`,
                  } as CSSProperties
                }
              >
                <div
                  className="relative h-(--scaled-book-height) w-(--scaled-book-width) flex-none"
                  style={
                    {
                      "--scaled-book-width": `${scaledBookWidth}px`,
                      "--scaled-book-height": `${scaledBookHeight}px`,
                      "--book-width": `${bookWidth}px`,
                      "--page-height": `${pageHeight}px`,
                      "--zoom": zoom,
                    } as CSSProperties
                  }
                >
                  <div
                    className={`absolute left-0 top-0 h-(--page-height) w-(--book-width) origin-top-left transform-[scale(var(--zoom))] ${isZoomed ? "pointer-events-none" : "pointer-events-auto"}`}
                  >
                    <HTMLFlipBook
                      key={`${isSingle ? "single" : "book"}-${numPages}-${pageWidth}-${pageHeight}`}
                      ref={bookRef as never}
                      width={pageWidth}
                      height={pageHeight}
                      size="fixed"
                      minWidth={pageWidth}
                      maxWidth={pageWidth}
                      minHeight={pageHeight}
                      maxHeight={pageHeight}
                      showCover={!isSingle}
                      drawShadow
                      maxShadowOpacity={0.2}
                      flippingTime={550}
                      usePortrait={isSingle}
                      autoSize={false}
                      mobileScrollSupport={false}
                      clickEventForward
                      useMouseEvents={!isZoomed}
                      showPageCorners={!isZoomed}
                      startPage={Math.min(currentIndex, numPages - 1)}
                      startZIndex={0}
                      swipeDistance={30}
                      disableFlipByClick={isZoomed}
                      className="m-0"
                      style={{}}
                      onInit={handleBookInit}
                      onFlip={handleFlip}
                    >
                      {Array.from({ length: numPages }, (_, index) => (
                        <FlipPage
                          key={index}
                          pageNumber={index + 1}
                          width={Math.max(120, pageWidth - 8)}
                          isRendered={
                            index >= firstVisible && index <= lastVisible
                          }
                        />
                      ))}
                    </HTMLFlipBook>
                  </div>
                </div>
              </div>
            </div>
            {!isMobile && (
              <ActionButton
                variant="secondary"
                className="absolute right-0 top-1/2 z-50 hidden size-9 min-h-9 -translate-y-1/2 rounded-full! p-0! shadow-md md:flex! md:mr-10 cursor-pointer"
                onClick={turnNext}
                disabled={!bookReady || currentIndex >= numPages - 1}
                aria-label="Next page"
              >
                <IconChevronRight size={22} />
              </ActionButton>
            )}
          </div>
        )}
      </Document>
      {numPages > 0 && (
        <div className="mt-1 flex w-full shrink-0 flex-wrap items-center justify-between gap-2 px-1 pb-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {isMobile && (
              <ActionButton
                variant="secondary"
                className="size-7! min-h-7! min-w-7! p-0! cursor-pointer"
                onClick={turnPrevious}
                disabled={!bookReady || currentIndex <= 0}
                aria-label="Previous page"
                title="Previous page"
              >
                <IconChevronLeft size={15} />
              </ActionButton>
            )}
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-[11px] tabular-nums text-slate-500">
              <IconBook2 size={16} className="hidden md:inline" />
              <strong className="font-extrabold text-indigo-700">
                {Math.min(currentIndex + 1, numPages)}
              </strong>
              <span>/</span>
              {numPages}
            </span>
            {isMobile && (
              <ActionButton
                variant="secondary"
                className="size-7! min-h-7! min-w-7! p-0! cursor-pointer"
                onClick={turnNext}
                disabled={!bookReady || currentIndex >= numPages - 1}
                aria-label="Next page"
                title="Next page"
              >
                <IconChevronRight size={15} />
              </ActionButton>
            )}
            <label className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/80 p-0.5">
              <span className="sr-only">Go to page</span>
              <input
                className="w-12 rounded-md bg-transparent pl-0.5 text-center text-[9px] tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:text-xs"
                aria-label="Go to page"
                inputMode="numeric"
                type="number"
                min={1}
                max={numPages}
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onBlur={commitPageInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitPageInput();
                    event.currentTarget.blur();
                  }
                }}
              />
              <span className="pr-0.5 text-[12px] font-semibold text-slate-500 cursor-pointer">
                Go
              </span>
            </label>
          </div>
          <input
            className="h-1.5 min-w-16 flex-1 cursor-pointer accent-indigo-600"
            type="range"
            min={1}
            max={Math.max(1, numPages)}
            value={Math.min(currentIndex + 1, numPages)}
            onChange={(event) => goToPage(Number(event.target.value) - 1)}
            aria-label="Reading progress"
            title={`Page ${currentIndex + 1} of ${numPages}`}
          />
          <div
            className={`flex flex-wrap items-center gap-1 ${
              isMobile ? "w-full justify-between" : "justify-end"
            }`}
          >
            <div
              className="inline-flex items-center gap-0.5 rounded-[10px] border border-[#e4e6f1] bg-white/70 p-0.5"
              role="group"
              aria-label="PDF zoom controls"
            >
              <ActionButton
                variant="ghost"
                className="size-7! min-h-7! min-w-7! p-0! cursor-pointer"
                onClick={() =>
                  setZoom((current) =>
                    Math.max(1, Math.round((current - 0.25) * 100) / 100),
                  )
                }
                disabled={zoom <= 1}
                aria-label="Zoom out"
                title="Zoom out"
              >
                <IconZoomOut size={15} />
              </ActionButton>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  if (scrollViewportRef.current) {
                    scrollViewportRef.current.scrollTop = 0;
                    scrollViewportRef.current.scrollLeft = 0;
                  }
                }}
                aria-label="Reset zoom to 100 percent"
                title="Reset zoom"
                className="min-w-9 rounded-md px-0.5 text-[8px] font-extrabold tabular-nums text-[#555b70] hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:text-[10px]"
              >
                {Math.round(zoom * 100)}%
              </button>
              <ActionButton
                variant="ghost"
                className="size-7! min-h-7! min-w-7! p-0! cursor-pointer"
                onClick={() =>
                  setZoom((current) =>
                    Math.min(2.5, Math.round((current + 0.25) * 100) / 100),
                  )
                }
                disabled={zoom >= 2.5}
                aria-label="Zoom in"
                title="Zoom in"
              >
                <IconZoomIn size={15} />
              </ActionButton>
            </div>
            {!isMobile && (
              <div
                className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white/70 p-0.5"
                role="group"
                aria-label="Page layout"
              >
                <ActionButton
                  className="h-7! min-h-7! px-2! py-1! text-[10px]! cursor-pointer"
                  variant={!singlePage ? "primary" : "ghost"}
                  onClick={() => setSinglePage(false)}
                  aria-pressed={!singlePage}
                >
                  <IconBook2 size={14} />
                  Book view
                </ActionButton>
                <ActionButton
                  className="h-7! min-h-7! px-2! py-1! text-[10px]! cursor-pointer"
                  variant={singlePage ? "primary" : "ghost"}
                  onClick={() => setSinglePage(true)}
                  aria-pressed={singlePage}
                >
                  <IconFileText size={14} />
                  Single page
                </ActionButton>
              </div>
            )}
            <ActionButton
              className="h-7! min-h-7! px-2! py-1! text-[10px]! cursor-pointer"
              variant="secondary"
              onClick={toggleFullscreen}
              aria-label={
                fullscreenActive ? "Exit fullscreen" : "Enter fullscreen"
              }
            >
              {fullscreenActive ? (
                <IconMinimize size={15} />
              ) : (
                <IconMaximize size={15} />
              )}
              <span className="hidden sm:inline">
                {fullscreenActive ? "Exit fullscreen" : "Fullscreen"}
              </span>
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
