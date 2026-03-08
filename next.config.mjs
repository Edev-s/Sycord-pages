/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    // Validate that the value is a plain hostname (no protocol, path, or query chars)
    if (!firebaseAuthDomain || !/^[a-zA-Z0-9._-]+$/.test(firebaseAuthDomain)) return []
    return [
      // Proxy Firebase Auth popup/redirect handler so that signInWithPopup works
      // when authDomain is set to this app's custom domain instead of
      // the default <project>.firebaseapp.com.
      {
        source: "/__/auth/:path*",
        destination: `https://${firebaseAuthDomain}/__/auth/:path*`,
      },
      {
        source: "/__/firebase/:path*",
        destination: `https://${firebaseAuthDomain}/__/firebase/:path*`,
      },
    ]
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
