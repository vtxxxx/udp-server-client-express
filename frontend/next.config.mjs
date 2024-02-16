/** @type {import('next').NextConfig} */

import withPlugins from "next-compose-plugins";
import withSvgr from "next-svgr";

const nextConfig = withPlugins([
  withSvgr,
  // your other plugins here
]);

export default nextConfig;
