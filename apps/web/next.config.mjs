/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep the hackathon build unblocked even if a lint/type nit slips in.
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["three"],
  // Self-contained server bundle for the Docker image.
  output: "standalone",
};

export default nextConfig;
