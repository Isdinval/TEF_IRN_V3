import { Metadata } from 'next';
import { siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: {
    default: "Guides TEF IRN - LlamaKusi",
    template: "%s | LlamaKusi",
  },
  description: "Tous nos guides gratuits pour réussir le TEF IRN : grammaire, vocabulaire, stratégies d'examen.",
  alternates: { canonical: `${siteUrl}/tef-irn/guides` },
};

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
