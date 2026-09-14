import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://llamakusi.com',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jksrmyyfllitrkarvgvk.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/', destination: '/tef-irn/', permanent: true },
      { source: '/TEF_IRN/:path*', destination: '/tef-irn/:path*', permanent: true },
      {
        source: '/examen-civique/guides/examen-blanc-trouver-centre-examen-civique',
        destination: '/examen-civique/guides/examen-blanc-civique-gratuit-en-ligne',
        permanent: true,
      },
    ];
  }
};

export default nextConfig;
