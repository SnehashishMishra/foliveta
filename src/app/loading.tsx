export default function Loading() {
  return (
    <main className="grid min-h-[60vh] place-content-center justify-items-center gap-3 text-sm text-muted-foreground">
      <span className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary motion-reduce:animate-none" />
      <p>Preparing Folio…</p>
    </main>
  );
}
