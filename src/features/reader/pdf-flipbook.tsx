"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
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
} from "@tabler/icons-react";
import { ActionButton } from "@/components/ui/action-button";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

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
    <div ref={ref} className="pdf-flip-page" data-density="soft">
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
              className="page-skeleton"
              aria-label={`Loading page ${pageNumber}`}
            />
          }
        />
      ) : (
        <div className="page-skeleton page-placeholder" aria-hidden="true">
          <IconFileText size={24} stroke={1.3} />
        </div>
      )}
      <span className="pdf-page-number" aria-hidden="true">
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
  const [pageInput, setPageInput] = useState(
    String(Math.max(1, initialPage)),
  );
  const [isMobile, setIsMobile] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 900, height: 500 });
  const [singlePage, setSinglePage] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [bookReady, setBookReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<FlipBookHandle | null>(null);

  useEffect(() => {
    setNumPages(0);
    setCurrentIndex(Math.max(0, initialPage - 1));
    setPageInput(String(Math.max(1, initialPage)));
    setBookReady(false);
    setPdfError("");
  }, [file, initialPage]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
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
  }, []);

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
      const restoredIndex = Math.min(
        Math.max(0, initialPage - 1),
        count - 1,
      );
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

  // Keep the flipbook at a stable, fitted size. Zoom is intentionally removed.
  const stageWidth = Math.max(
    320,
    stageSize.width - (fullscreenActive ? 16 : 24),
  );
  const stageHeight = Math.max(240, stageSize.height - 24);
  const fitWidth = Math.min(
    // On phones, use almost the full available width. Desktop keeps the
    // wider gutter needed for the two-page spread and edge controls.
    isSingle ? stageWidth - (isMobile ? 8 : 92) : (stageWidth - 100) / 2,
    stageHeight / PAGE_ASPECT,
    isMobile ? 560 : 500,
  );
  const pageWidth = Math.max(150, Math.floor(fitWidth));
  const pageHeight = Math.round(pageWidth * PAGE_ASPECT);
  const firstVisible = Math.max(0, currentIndex - 2);
  const lastVisible = Math.min(numPages - 1, currentIndex + 4);

  return (
    <div
      ref={containerRef}
      className={`flipbook-container ${fullscreenActive ? "flipbook-fullscreen" : ""}`}
      style={{
        overflow: "hidden",
        minWidth: 0,
        minHeight: 0,
        overscrollBehavior: "none",
      }}
    >
      {fullscreenActive && (
        <div className="flipbook-fullscreen-heading">
          <span className="truncate">{file.name}</span>
          <ActionButton
            variant="secondary"
            onClick={toggleFullscreen}
            aria-label="Exit fullscreen"
          >
            <IconMinimize size={17} />
            <span>Exit fullscreen</span>
          </ActionButton>
        </div>
      )}

      {pdfError && (
        <div className="notice notice-error" role="alert">
          {pdfError}
        </div>
      )}

      <Document
        file={file}
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
          <div className="reader-loading">
            <span className="loading-spinner" />
            <p>Reading your PDF…</p>
          </div>
        }
        error={
          <div className="reader-error">
            <IconFileText size={28} />
            <h3>We couldn&apos;t open this PDF.</h3>
            <p>Check the browser console for the underlying error.</p>
          </div>
        }
      >
        {numPages > 0 && (
          <div
            ref={stageRef}
            className="flipbook-stage"
            style={{
              overflow: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              overscrollBehavior: "none",
              minWidth: 0,
              minHeight: 0,
              contain: "layout paint",
            }}
          >
            <ActionButton
              variant="secondary"
              className="page-edge-control page-edge-left desktop-page-edge-control"
              onClick={turnPrevious}
              disabled={!bookReady || currentIndex <= 0}
              aria-label="Previous page"
              style={{ zIndex: 50 }}
            >
              <IconChevronLeft size={22} />
            </ActionButton>

            <div
              className="flipbook-book-viewport"
              style={{
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                contain: "layout paint",
              }}
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
                useMouseEvents
                showPageCorners
                startPage={Math.min(currentIndex, numPages - 1)}
                startZIndex={0}
                swipeDistance={30}
                disableFlipByClick={false}
                className="folio-flipbook"
                style={{ margin: "0 auto" }}
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

            <ActionButton
              variant="secondary"
              className="page-edge-control page-edge-right desktop-page-edge-control"
              onClick={turnNext}
              disabled={!bookReady || currentIndex >= numPages - 1}
              aria-label="Next page"
              style={{ zIndex: 50 }}
            >
              <IconChevronRight size={22} />
            </ActionButton>
          </div>
        )}
      </Document>

      {numPages > 0 && (
        <div className="reader-controls-row">
          <div className="reader-page-navigation">
            {!isMobile && (
              <span className="reader-interaction-hint">
                Drag a corner to turn
              </span>
            )}

            <span className="page-counter">
              <IconBook2 size={16} />
              <strong>{Math.min(currentIndex + 1, numPages)}</strong>
              <span>/</span>
              {numPages}
            </span>

            <label className="page-jump-control">
              <span className="sr-only">Go to page</span>
              <input
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
              <span>Go</span>
            </label>
          </div>

          <input
            className="reading-progress-slider"
            type="range"
            min={1}
            max={Math.max(1, numPages)}
            value={Math.min(currentIndex + 1, numPages)}
            onChange={(event) => goToPage(Number(event.target.value) - 1)}
            aria-label="Reading progress"
            title={`Page ${currentIndex + 1} of ${numPages}`}
          />

          <div className="reader-control-actions">
            {!isMobile && (
              <div
                className="view-mode-switch"
                role="group"
                aria-label="Page layout"
              >
                <ActionButton
                  variant={!singlePage ? "primary" : "ghost"}
                  onClick={() => setSinglePage(false)}
                  aria-pressed={!singlePage}
                >
                  <IconBook2 size={16} />
                  Book view
                </ActionButton>
                <ActionButton
                  variant={singlePage ? "primary" : "ghost"}
                  onClick={() => setSinglePage(true)}
                  aria-pressed={singlePage}
                >
                  <IconFileText size={16} />
                  Single page
                </ActionButton>
              </div>
            )}

            {isMobile && (
              <ActionButton
                variant="secondary"
                className="mobile-reader-nav"
                onClick={turnPrevious}
                disabled={!bookReady || currentIndex <= 0}
                aria-label="Previous page"
                title="Previous page"
              >
                <IconChevronLeft size={20} />
              </ActionButton>
            )}

            <ActionButton
              variant="secondary"
              className="reader-fullscreen-button"
              onClick={toggleFullscreen}
              aria-label={
                fullscreenActive ? "Exit fullscreen" : "Enter fullscreen"
              }
            >
              {fullscreenActive ? (
                <IconMinimize size={17} />
              ) : (
                <IconMaximize size={17} />
              )}
              <span>{fullscreenActive ? "Exit fullscreen" : "Fullscreen"}</span>
            </ActionButton>

            {isMobile && (
              <ActionButton
                variant="secondary"
                className="mobile-reader-nav"
                onClick={turnNext}
                disabled={!bookReady || currentIndex >= numPages - 1}
                aria-label="Next page"
                title="Next page"
              >
                <IconChevronRight size={20} />
              </ActionButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
