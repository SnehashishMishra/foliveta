import Link from "next/link";
import {
  IconArrowUpRight,
  IconBook2,
  IconDeviceMobile,
  IconLock,
  IconSparkles,
  IconWand,
} from "@tabler/icons-react";
import { ActionButton } from "@/components/ui/action-button";

const features = [
  {
    icon: IconBook2,
    title: "A book, not a document",
    text: "Turn pages with a tactile flip animation, or switch to a clean single-page view.",
  },
  {
    icon: IconLock,
    title: "Private by design",
    text: "Your PDF is processed in your browser. The app never uploads your book to a server.",
  },
  {
    icon: IconDeviceMobile,
    title: "Comfortable everywhere",
    text: "A responsive reader adapts to your phone, tablet, laptop, and desktop.",
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 md:grid-cols-2 md:gap-12 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 text-[0.7rem] font-bold uppercase tracking-[0.17em] text-muted-foreground">
            <span className="size-2 rounded-full bg-[#7373df] shadow-[0_0_0_4px_#e6e7ff]" />{" "}
            A quieter way to read
          </div>
          <h1 className="mt-6 text-[clamp(2.8rem,7vw,4.5rem)] font-extrabold leading-[1.04] tracking-[-0.075em]">
            Your PDFs,
            <br />
            <span className="bg-gradient-to-r from-[#5151c7] to-[#8780e8] bg-clip-text text-transparent">
              turned into books.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            Bring your own PDF. Settle into a beautiful reading space with
            natural page turns, thoughtful controls, and privacy built in.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/read">
              <ActionButton
                variant="primary"
                className="min-h-12 rounded-2xl px-5 text-sm"
              >
                Open a book <IconArrowUpRight size={18} />
              </ActionButton>
            </Link>
            <Link
              href="/history"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-secondary-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              View reading history <IconArrowUpRight size={16} />
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <IconLock size={16} stroke={1.8} className="text-[#7777a2]" />
            <span>Your PDF stays on your device</span>
            <span className="text-border">·</span>
            <span>No account needed</span>
          </div>
        </div>

        <div
          className="relative isolate mx-auto grid min-h-[300px] w-full max-w-[500px] place-items-center sm:min-h-[390px]"
          aria-label="Illustration of an open book"
          role="img"
        >
          <div className="absolute size-[min(80vw,340px)] rounded-full bg-[radial-gradient(circle,rgba(221,222,255,0.8),rgba(241,242,255,0.2)_66%,transparent_70%)]" />
          <div className="absolute h-[190px] w-[min(88vw,440px)] rotate-[-20deg] rounded-[50%] border border-[#8d91d8]/20 sm:h-[210px]" />
          <div className="absolute h-[230px] w-[min(78vw,390px)] rotate-[27deg] rounded-[50%] border border-[#8d91d8]/20 sm:h-[270px]" />
          <div className="relative h-[225px] w-[min(88vw,370px)] -rotate-[5deg] [perspective:1100px] sm:h-[265px]">
            <div className="absolute inset-x-4 bottom-0 h-4 rounded-full bg-[#b9b9d5]/50 blur-lg" />
            <div className="absolute bottom-3 left-0 top-3 w-1/2 rounded-l-md border border-[#e7e5df] bg-gradient-to-br from-white to-[#faf9f4] p-5 shadow-[inset_0_0_24px_rgba(45,48,68,0.02)] sm:p-6">
              <span className="block text-[6px] font-extrabold tracking-[0.2em] text-[#8888a5] sm:text-[7px]">
                A LITTLE SPACE TO THINK
              </span>
              <span className="mt-5 block h-0.5 w-7 bg-[#7777d9]" />
              <span className="mt-4 block h-16 bg-[repeating-linear-gradient(to_bottom,#dfe0e8_0_2px,transparent_2px_9px)] opacity-80" />
              <span className="absolute bottom-3 left-5 text-[7px] text-[#a1a3b1]">
                12
              </span>
            </div>
            <div className="absolute bottom-3 right-0 top-3 w-1/2 rounded-r-md border border-l-0 border-[#e7e5df] bg-gradient-to-br from-white to-[#faf9f4] p-5 shadow-[inset_0_0_24px_rgba(45,48,68,0.02)] sm:p-6">
              <span className="block text-[6px] font-extrabold tracking-[0.2em] text-[#8888a5] sm:text-[7px]">
                CHAPTER II
              </span>
              <span className="mt-4 block font-serif text-lg leading-[1.08] tracking-tight text-[#36384f] sm:text-xl">
                The art of
                <br />
                slowing down
              </span>
              <span className="mt-4 block h-14 bg-[repeating-linear-gradient(to_bottom,#dfe0e8_0_2px,transparent_2px_9px)] opacity-80" />
              <span className="absolute bottom-3 right-5 text-[7px] text-[#a1a3b1]">
                13
              </span>
            </div>
            <div className="absolute bottom-3 left-1/2 top-3 w-[3px] -translate-x-1/2 bg-gradient-to-r from-[#d4d1c8] via-[#f7f5ee] to-[#d8d5cd]" />
          </div>
          <div className="absolute right-0 top-6 inline-flex -rotate-2 items-center gap-2 rounded-2xl border border-white/90 bg-white/85 px-3 py-2.5 text-[10px] font-bold text-[#535871] shadow-glass backdrop-blur-xl sm:right-1 sm:top-9 sm:px-4">
            <IconSparkles size={16} className="text-primary" /> A little more
            immersive
          </div>
          <div className="absolute bottom-3 left-0 inline-flex rotate-2 items-center gap-2 rounded-2xl border border-white/90 bg-white/85 px-3 py-2.5 text-[10px] font-bold text-[#535871] shadow-glass backdrop-blur-xl sm:bottom-7 sm:left-2 sm:px-4">
            <span className="size-2 rounded-full bg-[#42a87a] shadow-[0_0_0_4px_#e2f5ec]" />{" "}
            Local-first reading
          </div>
          <span className="sr-only">
            An open book illustration representing a PDF flipbook.
          </span>
        </div>
      </section>

      <section
        className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-3 border-y border-border/80 px-4 py-5 text-center text-[11px] font-semibold text-muted-foreground sm:gap-x-7 sm:px-6 lg:px-8"
        aria-label="Reader benefits"
      >
        <span>Made for focus</span>
        <span className="hidden size-1 rounded-full bg-[#c2c5d1] sm:block" />
        <span>No uploads</span>
        <span className="hidden size-1 rounded-full bg-[#c2c5d1] sm:block" />
        <span>No account required</span>
        <span className="hidden size-1 rounded-full bg-[#c2c5d1] sm:block" />
        <span>Free to use</span>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.18em] text-muted-foreground">
            THE READING SPACE
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.055em] sm:text-4xl">
            Everything you need.
            <br />
            <span className="text-muted-foreground/70">
              Nothing in the way.
            </span>
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }, index) => (
            <article
              className="group relative rounded-3xl border border-white/90 bg-white/75 p-6 shadow-card backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-glass motion-reduce:transform-none sm:p-7"
              key={title}
            >
              <div className="grid size-12 place-items-center rounded-2xl border border-[#e4e5fb] bg-gradient-to-br from-white to-[#e9eaff] text-primary">
                <Icon size={23} stroke={1.7} />
              </div>
              <span className="absolute right-6 top-7 text-xs font-bold tracking-widest text-[#c5c7d7]">
                0{index + 1}
              </span>
              <h3 className="mt-6 text-lg font-bold tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="flex flex-col gap-6 rounded-[2rem] border border-white/90 bg-gradient-to-br from-white/90 via-white/75 to-[#efefff]/80 p-6 shadow-glass backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between sm:p-10 lg:p-12">
          <div>
            <span className="text-[0.7rem] font-bold tracking-[0.18em] text-muted-foreground">
              READY WHEN YOU ARE
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.05em] sm:text-3xl">
              Make room for a good read.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Choose a PDF from your device and pick up a page at a time.
            </p>
          </div>
          <Link href="/read" className="shrink-0">
            <ActionButton
              variant="primary"
              className="min-h-12 rounded-2xl px-5"
            >
              Start reading <IconWand size={18} />
            </ActionButton>
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-3 border-t border-border/80 px-4 py-7 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
        <Link href="/" className="text-lg font-extrabold tracking-[-0.07em]">
          folio<span className="text-primary">.</span>
        </Link>
        <p className="text-xs text-muted-foreground">
          Made for the joy of turning one more page.
        </p>
        <Link
          href="/history"
          className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          Your reading history
        </Link>
      </footer>
    </main>
  );
}
