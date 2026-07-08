import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://llamakusi.com',
  },
  async redirects() {
    return [
      { source: '/', destination: '/tef-irn/', permanent: true },
      { source: '/TEF_IRN/:path*', destination: '/tef-irn/:path*', permanent: true },
    ];
  }
};

export default nextConfig;
