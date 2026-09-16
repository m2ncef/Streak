/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: [
      "playwright",
      "playwright-core",
      "p-limit",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(({ request }, callback) => {
        if (
          request === "playwright" ||
          request === "playwright-core" ||
          request === "electron"
        ) {
          return callback(null, "commonjs " + request);
        }
        callback();
      });
    } else {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    }
    return config;
  },
};

export default nextConfig;
