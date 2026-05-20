/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",          // static HTML for GitHub Pages
  images: { unoptimized: true },
  trailingSlash: true,       // GH Pages serves /path/ not /path
  // When deployed under a subpath (e.g., /snapcommit on GitHub Pages),
  // set BASE_PATH env at build time. Vercel uses the root path automatically.
  basePath: process.env.BASE_PATH || "",
  assetPrefix: process.env.BASE_PATH || "",
};

export default nextConfig;
