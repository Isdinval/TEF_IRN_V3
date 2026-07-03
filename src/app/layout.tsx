import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/shared/AppLayout";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ParcoursWrapper } from "@/components/providers/ParcoursWrapper";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase-server";
import { Analytics } from "@vercel/analytics/next";
import { siteUrl } from "@/lib/site";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LlamaKusi - Coach IA TEF IRN / Examens de français",
    template: "%s | LlamaKusi"
  },
  description: "Réussissez votre TEF IRN (Naturalisation & Résidence) avec LlamaKusi, le coach personnel alimenté par l'IA. Exercices interactifs, corrections temps réel et préparation complète.",
  keywords: ["TEF IRN", "Test d'Évaluation de Français", "Nationalité française", "Carte de résident", "Examen de français", "Coach IA français", "Apprendre le français", "A2", "B1"],
  authors: [{ name: "LlamaKusi Team" }],
  creator: "LlamaKusi",
  publisher: "LlamaKusi",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "LlamaKusi",
    title: "LlamaKusi - Coach IA TEF IRN / Examens de français",
    description: "La plateforme n°1 pour réussir son TEF IRN grâce à l'intelligence artificielle.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "LlamaKusi - Coach IA TEF IRN",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LlamaKusi - Coach IA TEF IRN",
    description: "Réussissez votre TEF IRN avec l'IA.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LlamaKusi",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "LlamaKusi est la plateforme de référence pour la préparation au TEF IRN, utilisant l'intelligence artificielle pour accompagner les candidats vers la réussite de leur examen de français.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "FR"
    }
  };

  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} ${montserrat.variable} font-sans h-full bg-slate-50/30`}>
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider initialUser={user}>
              <ParcoursWrapper>
                <AppLayout>{children}</AppLayout>
              </ParcoursWrapper>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
