// src/app/layout.tsx
import { TRPCProvider } from "./providers";
import { GeistSans } from "geist/font/sans";
import "~/styles/globals.css";

export const metadata = {
  title: "SimplerPost - Send Letters Without a Printer",
  description: "Send physical letters in a few clicks without a printer",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
