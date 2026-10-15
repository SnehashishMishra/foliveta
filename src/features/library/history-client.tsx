"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconBook2,
  IconClock,
  IconFileTypePdf,
  IconHistory,
  IconLock,
  IconTrash,
  IconX,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { ActionButton } from "@/components/ui/action-button";
import { usePdfSession } from "@/features/reader/pdf-session-provider";
import {
  clearBooks,
  listBooks,
  removeBook,
  rememberBook,
} from "@/lib/storage/history-db";
import { formatBytes, formatDate, validatePdfFile } from "@/lib/pdf/file-utils";
import type { BookRecord } from "@/types/book";

type Confirmation = { kind: "one"; book: BookRecord } | { kind: "all" } | null;

export function HistoryClient() {
  const router = useRouter();
  const { setSession } = usePdfSession();
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setBooks(await listBooks());
      setError("");
    } catch {
      setError(
        "Your browser could not access local history. Check that site storage is enabled.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load IndexedDB-backed history when this screen mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const openBook = async (book: BookRecord) => {
    setError("");
    setInfo("");
    setBusyId(book.id);
    try {
      if (!book.handle) {
        router.push(`/read?history=${encodeURIComponent(book.id)}`);
        return;
      }
      let permission: PermissionState | undefined =
        await book.handle.queryPermission?.({ mode: "read" });
      if (permission !== "granted" && book.handle.requestPermission)
        permission = await book.handle.requestPermission({ mode: "read" });
      if (permission === "denied") {
        setInfo(
          `Access to “${book.fileName}” was denied. Select the file again from the reader to reopen it.`,
        );
        router.push(`/read?history=${encodeURIComponent(book.id)}`);
        return;
      }
      const file = await book.handle.getFile();
      const validationError = await validatePdfFile(file);
      if (validationError) {
        setInfo(
          `${validationError} Select the file again to repair this history item.`,
        );
        router.push(`/read?history=${encodeURIComponent(book.id)}`);
        return;
      }
      const updated = await rememberBook(file, book.handle, book.id);
      setSession({
        file,
        handle: book.handle,
        historyId: updated.id,
        lastPage: book.lastPage ?? 1,
      });
      router.push("/read");
    } catch {
      setInfo(
        `The saved file reference for “${book.fileName}” is no longer available. Choose the PDF again to reopen it.`,
      );
      router.push(`/read?history=${encodeURIComponent(book.id)}`);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!confirmation) return;
    try {
      if (confirmation.kind === "one") await removeBook(confirmation.book.id);
      else await clearBooks();
      setConfirmation(null);
      await refresh();
    } catch {
      setError("The history could not be updated. Please try again.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-7 sm:px-6 sm:pt-10 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <IconArrowLeft size={16} /> Back home
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.055em] sm:text-4xl">
            Your reading history
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Books remembered by this browser, on this device.
          </p>
        </div>
        {books.length > 0 && (
          <ActionButton
            variant="secondary"
            onClick={() => setConfirmation({ kind: "all" })}
          >
            <IconTrash size={17} /> Clear history
          </ActionButton>
        )}
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/10 bg-linear-to-r from-white/90 to-accent/50 p-4 sm:p-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-primary shadow-sm">
          <IconLock size={20} />
        </div>
        <div>
          <p className="text-sm font-bold">
            Stored locally, not on our servers
          </p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">
            History contains book details and, where supported, a browser file
            handle. The PDF itself is not stored by this app.
          </p>
        </div>
      </div>
      {error && (
        <div
          className="mb-4 rounded-xl border border-destructive/20 bg-red-50 px-4 py-3 text-sm text-[#a93847]"
          role="alert"
        >
          {error}
        </div>
      )}
      {info && (
        <div
          className="mb-4 flex items-start gap-2 rounded-xl border border-primary/15 bg-accent/60 px-4 py-3 text-sm text-accent-foreground"
          role="status"
        >
          <span className="flex-1">{info}</span>
          <button
            aria-label="Dismiss notice"
            onClick={() => setInfo("")}
            className="rounded-lg p-1 hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <IconX size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid min-h-64 place-content-center justify-items-center gap-3 text-sm text-muted-foreground">
          <span className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary motion-reduce:animate-none" />
          <p>Loading your library…</p>
        </div>
      ) : books.length === 0 ? (
        <section className="mx-auto grid max-w-2xl justify-items-center rounded-4xl border border-white/90 bg-white/75 px-5 py-12 text-center shadow-glass backdrop-blur-xl sm:px-10 sm:py-16">
          <div className="grid size-16 place-items-center rounded-2xl bg-accent text-primary">
            <IconHistory size={29} />
          </div>
          <h2 className="mt-5 text-xl font-extrabold tracking-tight sm:text-2xl">
            No books here just yet.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
            When you open a PDF, its details will appear here so you can find it
            again later.
          </p>
          <Link href="/read" className="mt-6">
            <ActionButton variant="primary">
              <IconBook2 size={18} /> Open your first book{" "}
              <IconArrowUpRight size={16} />
            </ActionButton>
          </Link>
        </section>
      ) : (
        <div className="grid gap-3" aria-label="Previously opened books">
          {books.map((book) => (
            <article
              className="flex min-w-0 flex-col gap-4 rounded-2xl border border-white/90 bg-white/75 p-4 shadow-card backdrop-blur-xl transition-shadow hover:shadow-glass sm:flex-row sm:items-center sm:p-5"
              key={book.id}
            >
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                <IconFileTypePdf size={26} stroke={1.6} />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  className="truncate text-base font-bold tracking-tight"
                  title={book.title}
                >
                  {book.title}
                </h2>
                <p
                  className="mt-1 truncate text-xs text-muted-foreground"
                  title={book.fileName}
                >
                  {book.fileName}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-muted-foreground">
                  <span>{formatBytes(book.size)}</span>
                  <span className="text-border">·</span>
                  <span className="inline-flex items-center gap-1">
                    <IconClock size={13} /> Opened{" "}
                    {formatDate(book.lastOpenedAt)}
                  </span>
                  {book.pageCount ? (
                    <>
                      <span className="text-border">·</span>
                      <span>{book.pageCount} pages</span>
                    </>
                  ) : null}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {book.handle
                    ? "Saved file reference available · permission may be needed"
                    : "Select the PDF again to reopen"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                <ActionButton
                  variant="primary"
                  onClick={() => void openBook(book)}
                  disabled={busyId === book.id}
                >
                  {busyId === book.id ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
                  ) : (
                    <IconBook2 size={17} />
                  )}
                  <span>{busyId === book.id ? "Opening" : "Open book"}</span>
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  className="size-10 p-0!"
                  onClick={() => setConfirmation({ kind: "one", book })}
                  aria-label={`Remove ${book.title} from history`}
                  title="Remove from history"
                >
                  <IconX size={19} />
                </ActionButton>
              </div>
            </article>
          ))}
        </div>
      )}

      <AnimatePresence>
        {confirmation && (
          <motion.div
            className="fixed inset-0 z-120 grid place-items-center overflow-y-auto bg-[#20233a]/35 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setConfirmation(null);
            }}
          >
            <motion.section
              className="w-full max-w-md rounded-3xl border border-white/90 bg-white/95 p-6 shadow-2xl sm:p-7"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-description"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-red-50 text-destructive">
                <IconAlertTriangle size={24} />
              </div>
              <h2
                id="confirm-title"
                className="mt-5 text-xl font-extrabold tracking-tight"
              >
                {confirmation.kind === "all"
                  ? "Clear all reading history?"
                  : "Remove this book?"}
              </h2>
              <p
                id="confirm-description"
                className="mt-3 text-sm leading-7 text-muted-foreground"
              >
                {confirmation.kind === "all"
                  ? "This removes all saved book names and file references from this browser. Original files on your device are not deleted."
                  : `“${confirmation.book.title}” will be removed from your history. The original PDF on your device will not be deleted.`}
              </p>
              <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <ActionButton
                  variant="secondary"
                  onClick={() => setConfirmation(null)}
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  variant="danger"
                  onClick={() => void confirmDelete()}
                  className="text-black group"
                >
                  <IconTrash
                    size={17}
                    className="text-black group-hover:text-white"
                  />{" "}
                  <span className="text-black group-hover:text-white">
                    {confirmation.kind === "all"
                      ? "Clear history"
                      : "Remove book"}
                  </span>
                </ActionButton>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
