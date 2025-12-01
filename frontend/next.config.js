/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,

    // API proxy configuration for backend
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/:path*',
            },
        ];
    },

    // Environment variables exposed to the browser
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    },

    // Disable strict mode for better performance in development
    eslint: {
        ignoreDuringBuilds: true,
    },

    // TypeScript configuration
    typescript: {
        ignoreBuildErrors: false,
    },
};

module.exports = nextConfig;
