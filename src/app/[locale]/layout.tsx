// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { TRPCProvider } from "../providers";
import { GeistSans } from "geist/font/sans";
import "~/styles/globals.css";
import { notFound } from 'next/navigation';
import { locales, isSupportedLocale } from "~/i18n/locales";

export const metadata = {
  title: "PrintMail - Send Letters Without a Printer",
  description: "Send physical letters in a few clicks without a printer",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  
  let messages;
  try {
    messages = (await import(`../../i18n/locales/${locale}.json`)).default;
  } catch (error) {
    console.error('Error loading messages:', error);
    notFound();
  }

  return (
    <html lang={locale}>
      <body className={GeistSans.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TRPCProvider>{children}</TRPCProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
