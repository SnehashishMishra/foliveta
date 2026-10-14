import type { Metadata } from "next";
import { HistoryClient } from "@/features/library/history-client";

export const metadata: Metadata = {
  title: "Reading History",
  description: "Reopen your recently read PDFs in Foliveta.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HistoryPage() {
  return <HistoryClient />;
}
