import type { Metadata } from "next";
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
import JsonLd from "@/components/shared/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LlamaKusi - Coach IA TEF IRN / Examens de français",
    template: "%s | LlamaKusi"
  },
  description: "Réussissez votre TEF IRN avec un coach personnel alimenté par l'IA. Guides gratuits, exercices interactifs et préparation complète au certificat de français.",
  keywords: ["TEF IRN", "Test d'Évaluation de Français", "IA", "Coach Français", "Naturalisation", "Carte de résident", "Examen de français"],
  authors: [{ name: "LlamaKusi" }],
  creator: "LlamaKusi",
  publisher: "LlamaKusi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "LlamaKusi",
    title: "LlamaKusi - Réussissez le TEF IRN avec l'IA",
    description: "Le premier coach IA dédié à votre réussite au TEF IRN.",
    images: [
      {
        url: "/og-image.png", // Ensure this exists or use a default
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
    images: ["/og-image.png"],
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

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LlamaKusi",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "LlamaKusi est une plateforme d'apprentissage alimentée par l'intelligence artificielle pour préparer l'examen du TEF IRN.",
    "sameAs": [
      "https://www.facebook.com/llamakusi",
      "https://www.instagram.com/llamakusi",
      "https://www.linkedin.com/company/llamakusi"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "contact@llamakusi.com",
      "url": `${siteUrl}/contact`
    }
  };

  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} ${montserrat.variable} font-sans h-full bg-slate-50/30`}>
        <JsonLd data={organizationSchema} id="schema-org" />
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
