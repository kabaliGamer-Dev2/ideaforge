import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IdeaForge — AI Project Idea Generator & Mentor",
  description:
    "Tell us your interests and skills. Get ranked, fully-specified capstone project ideas with a visible reason for each ranking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}