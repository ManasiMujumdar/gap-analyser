import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The `backend` workspace package ships TypeScript source directly (see
  // backend/package.json exports) rather than a compiled build step, so it
  // needs to be transpiled by Next.js itself (design.md Decision #1).
  transpilePackages: ["backend"],
  webpack: (config) => {
    // backend's source uses NodeNext-style imports ("./foo.js" resolving to
    // "./foo.ts", per TypeScript's NodeNext moduleResolution) - webpack
    // doesn't apply that mapping by default, so it needs to be told to try
    // .ts/.tsx when a .js specifier doesn't resolve to a real .js file.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
