/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['node-ssh', 'ssh2'],
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    // NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is the custom authDomain (e.g. sycord.com).
    // NEXT_PUBLIC_FIREBASE_PROJECT_DOMAIN is the actual Firebase hosting origin
    // (e.g. <project-id>.firebaseapp.com) used as the proxy destination.
    //
    // These MUST be different values. If both point to the same host the proxy
    // would loop back to itself and Vercel returns 508 INFINITE_LOOP.
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    const projectDomain = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_DOMAIN

    // Validate that each value is a plain hostname (no protocol, path, or query chars)
    const hostnameRe = /^[a-zA-Z0-9._-]+$/
    if (!projectDomain || !hostnameRe.test(projectDomain)) return []

    // Guard: refuse to create a self-referential proxy that would cause an
    // infinite loop (e.g. authDomain === projectDomain === "sycord.com").
    if (authDomain && projectDomain === authDomain) {
      console.warn(
        "[next.config] NEXT_PUBLIC_FIREBASE_PROJECT_DOMAIN equals NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN " +
          `("${projectDomain}"). The Firebase auth proxy would loop back to itself and has been disabled. ` +
          "Set NEXT_PUBLIC_FIREBASE_PROJECT_DOMAIN to your <project-id>.firebaseapp.com hostname."
      )
      return []
    }

    return [
      // Proxy Firebase Auth popup/redirect handler so that signInWithPopup works
      // when authDomain is set to this app's custom domain instead of
      // the default <project>.firebaseapp.com.
      {
        source: "/__/auth/:path*",
        destination: `https://${projectDomain}/__/auth/:path*`,
      },
      {
        source: "/__/firebase/:path*",
        destination: `https://${projectDomain}/__/firebase/:path*`,
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
      {
        protocol: "https",
        hostname: "github.com",
        port: "",
        pathname: "/user-attachments/**",
      },
    ],
  },
}

export default nextConfig
