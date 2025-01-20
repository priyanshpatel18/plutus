import { siteConfig } from "@/components/config/siteConfig";
import { Toaster } from "@/components/ui/sonner";
import { Ubuntu } from "next/font/google";
import "./globals.css";

export const metadata = siteConfig;

const ubuntu = Ubuntu({ subsets: ["latin"], weight: ["400", "500", "700"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`bg-foreground text-background ${ubuntu.className} min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
