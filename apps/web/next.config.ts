import type { NextConfig } from "next";
import { loadRootEnv } from "./load-root-env";

loadRootEnv();

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
