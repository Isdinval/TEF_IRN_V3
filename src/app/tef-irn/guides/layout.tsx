import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: "Guides TEF IRN - LlamaKusi",
    template: "%s | LlamaKusi",
  },
  description: "Tous nos guides gratuits pour réussir le TEF IRN : grammaire, vocabulaire, stratégies d'examen.",
};

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
