import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";

const buildSha = process.env.BUILD_SHA ?? execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();

const nextConfig: NextConfig = {
  env: { BUILD_SHA: buildSha },
  experimental: {
    serverActions: { bodySizeLimit: "13mb" },
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
