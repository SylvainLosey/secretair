// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { TRPCProvider } from "../providers";
import { GeistSans } from "geist/font/sans";
import "~/styles/globals.css";
import { notFound } from 'next/navigation';
import { locales, isSupportedLocale } from "~/i18n/locales";
import { Toaster } from '~/components/ui/sonner';
import { AppProviders } from "~/app/providers";

export const metadata = {
  title: "PostMail - Send Physical Letters Without a Printer",
  description: "Send formal letters, cancel services, or respond to documents without needing a printer. Fast, affordable physical mail delivery in a few clicks.",
  keywords: "mail service, send letters, cancel subscriptions, no printer needed, physical mail online",
  openGraph: {
    title: "PostMail - Send Letters Without a Printer",
    description: "Send formal letters, cancel services, or respond to documents without needing a printer.",
    url: "https://postmail.ai",
    siteName: "PostMail",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://postmail.ai",
    languages: {
      en: "https://postmail.ai/en",
      fr: "https://postmail.ai/fr",
      de: "https://postmail.ai/de",
    },
  },
  // TODO: add verification
  // verification: {
  //   google: "your-google-verification-code",
  // },
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
          <AppProviders>
            <TRPCProvider>
              {children}
              <Toaster />
            </TRPCProvider>
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
