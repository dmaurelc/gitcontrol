import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// metadataBase makes OG and canonical URLs absolute. Read from
// BETTER_AUTH_URL because that env var already carries the deployment
// origin everywhere the app runs (Dokploy prod, Vercel staging, dev).
const SITE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const SITE_NAME = "GitControl";
const SITE_DESCRIPTION =
  "Self-hosted GitHub dashboard. Manage your repos, issues, pull requests, stars and projects from a single private workspace running on your own infrastructure.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Self-hosted GitHub Dashboard`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "GitHub dashboard",
    "self-hosted",
    "developer tools",
    "GitHub manager",
    "repositories",
    "pull requests",
  ],
  authors: [{ name: "DanielMC", url: "https://github.com/dmaurelc" }],
  creator: "DanielMC",
  alternates: {
    canonical: "/",
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
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Self-hosted GitHub Dashboard`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Self-hosted GitHub Dashboard`,
    description: SITE_DESCRIPTION,
    creator: "@dmaurelc",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  category: "developer tools",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${chakraPetch.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" richColors closeButton theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  );
}
