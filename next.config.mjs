
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'pub-cfa5cec7115b44fd80799055729b4709.r2.dev' },
      { protocol: 'https', hostname: '*.cloudflare.com' },
    ],
  },
  async redirects() {
    return [
      // Short, shareable profile link used by the Socials QR pack.
      { source: '/p/:username', destination: '/photographers/:username', permanent: true },
    ]
  },
  webpack(config, { isServer }) {
    if (isServer) {
      // Keep ffmpeg native binaries as external — they can't be bundled
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        'fluent-ffmpeg',
        '@ffmpeg-installer/ffmpeg',
        'sharp',
      ]
    }
    return config
  },
}

export default nextConfig
