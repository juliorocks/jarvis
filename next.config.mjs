import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable source maps for easier debugging
    productionBrowserSourceMaps: true,
    experimental: {
        workerThreads: false,
        cpus: 1
    }
};

if (process.env.NODE_ENV === 'development') {
    (async () => {
        await setupDevPlatform();
    })();
}

export default nextConfig;
