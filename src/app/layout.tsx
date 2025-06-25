// app/layout.tsx
import "./globals.css";
import { Providers } from "./providers";
import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

// 環境変数から値を取得
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hiphop-roots.com";
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

// JSON-LD構造化データ
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "HIPHOP ROOTS",
  description: "世界のラップを地図で聴く",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: "HIPHOP ROOTS",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/ogp-image.png`,
      width: 1200,
      height: 630,
    },
  },
  creator: {
    "@type": "Person",
    name: "Hinako Nakamura",
    url: "https://x.com/hina_gon_81",
  },
};

export const metadata: Metadata = {
  title: {
    default: "HIPHOP ROOTS - 世界のラップを地図で聴く",
    template: "%s | HIPHOP ROOTS",
  },
  description:
    "HIPHOP ROOTSは、ヒップホップカルチャーを形作ってきたアーティストたちの出身地や育った場所を世界地図上にプロットしたサービスです。街、地区、国——場所には物語がある。音楽と土地のつながりを感じ、ヒップホップの多様なルーツに触れてください。",
  keywords: [
    "HIPHOP",
    "ラップ",
    "ヒップホップ",
    "地図",
    "音楽",
    "アーティスト",
    "ルーツ",
    "Rap",
    "HipHop",
    "Map",
    "Music",
    "Artist",
  ],
  authors: [{ name: "Hinako Nakamura" }],
  creator: "Hinako Nakamura",
  publisher: "HIPHOP ROOTS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "HIPHOP ROOTS",
    title: "HIPHOP ROOTS - 世界のラップを地図で聴く",
    description:
      "ヒップホップカルチャーを形作ってきたアーティストたちの出身地や育った場所を世界地図上にプロットしたサービスです。音楽と土地のつながりを感じ、ヒップホップの多様なルーツに触れてください。",
    images: [
      {
        url: "/ogp-image.png",
        width: 1200,
        height: 630,
        alt: "HIPHOP ROOTS - 世界のラップを地図で聴く",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HIPHOP ROOTS - 世界のラップを地図で聴く",
    description:
      "ヒップホップカルチャーを形作ってきたアーティストたちの出身地や育った場所を世界地図上にプロットしたサービスです。",
    images: ["/ogp-image.png"],
    creator: "@hina_gon_81",
    site: "@hina_gon_81",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    ...(googleVerification && { google: googleVerification }),
  },
  category: "music",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "16x16 32x32", type: "image/png" },
      {
        url: "/ogp-image.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/ogp-image.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "HIPHOP ROOTS",
    "application-name": "HIPHOP ROOTS",
    "msapplication-TileColor": "#2d2300",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
        <link
          rel="icon"
          href="/ogp-image.png"
          type="image/png"
          sizes="192x192"
        />
        <link rel="apple-touch-icon" href="/ogp-image.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2d2300" />
        <meta name="msapplication-TileColor" content="#2d2300" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta
          name="format-detection"
          content="telephone=no, email=no, address=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HIPHOP ROOTS" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={bebasNeue.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
