import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MEDUTA",
    template: "%s",
  },
  description:
    "Buat undangan digital pernikahan yang elegan, bagikan dengan tamu, dan kelola RSVP dengan mudah.",
  applicationName: "Meduta",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://meduta.my.id",
  ),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Font elegan dimuat via CDN (di-fetch browser, bukan server) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Great+Vibes&family=Bebas+Neue&family=Inter:wght@300;400;500;600;700;800&family=Jost:wght@300;400;500&family=Pinyon+Script&family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
