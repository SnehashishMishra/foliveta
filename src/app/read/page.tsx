import type { Metadata } from "next";
import { ReaderClient } from "@/features/reader/reader-client";

export const metadata: Metadata = {
  title: "Read PDFs Online",
  description:
    "Open and read PDFs in Foliveta's interactive flipbook reader, with page-turn navigation on desktop, tablet, and mobile.",
  alternates: {
    canonical: "/read",
  },
};

export default function ReaderPage() {
  return <ReaderClient />;
}
