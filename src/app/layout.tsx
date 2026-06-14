import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/shared/AppLayout";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ParcoursWrapper } from "@/components/providers/ParcoursWrapper";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Maîtris - Coach IA TEF IRN",
  description: "Réussissez votre TEF IRN avec un coach personnel alimenté par l'IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} ${montserrat.variable} font-sans h-full bg-slate-50/30`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <ParcoursWrapper>
              <AppLayout>{children}</AppLayout>
            </ParcoursWrapper>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
