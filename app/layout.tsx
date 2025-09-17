import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import { Navigation } from "@/components/layout/Navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CitiWise Agent - AI Real Estate Sales Automation",
  description: "Automate your real estate sales end-to-end with AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans antialiased h-full bg-gray-50`}>
        <div className="min-h-full">
          {/* Navigation temporarily disabled for prod blank-screen diagnosis */}
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
