export const idlePageHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sycord | Site Placeholder</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background: #0f1115;
        color: #f5f5f5;
        font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
      }
      .page {
        min-height: 100vh;
        background: #0f1115;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 36px 24px 32px;
      }
      .logo {
        width: 86px;
        height: 48px;
      }
      .hero {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 24px;
        margin-top: 48px;
        max-width: 520px;
      }
      h1 {
        margin: 0;
        font-size: 36px;
        line-height: 1.1;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      p {
        margin: 0;
      }
      .subtitle {
        color: #d2d4d8;
        font-size: 20px;
        line-height: 1.4;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 46px;
        border-radius: 999px;
        background: #5f636b;
        color: #f5f5f5;
        font-size: 22px;
        font-weight: 700;
        text-decoration: none;
        transition: background 0.2s ease, transform 0.2s ease;
      }
      .button:hover {
        background: #6d727b;
        transform: translateY(-1px);
      }
      .footer {
        color: #c9c9c9;
        font-size: 15px;
        text-align: center;
        letter-spacing: 0.01em;
      }
      @media (min-width: 768px) {
        .page { padding: 48px 72px 40px; }
        h1 { font-size: 42px; }
        .subtitle { font-size: 22px; }
        .button { font-size: 24px; padding: 16px 56px; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <svg class="logo" viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 52V24c0-6.627 5.373-12 12-12h18c5.523 0 10 4.477 10 10v30H12Z" fill="#d9d9d9"/>
        <path d="M108 52V24c0-6.627-5.373-12-12-12H78c-5.523 0-10 4.477-10 10v30h40Z" fill="#8d8f93"/>
        <path d="M60 52c0-13.255-10.745-24-24-24H12v24h48Z" fill="#b8babc" opacity="0.75"/>
        <path d="M60 52c0-13.255 10.745-24 24-24h24v24H60Z" fill="#7a7c80" opacity="0.8"/>
      </svg>

      <main class="hero">
        <h1>Here is your site</h1>
        <p class="subtitle">set up your website stile on the dasboard</p>
        <a class="button" href="/dashboard">return</a>
      </main>

      <p class="footer">privacy and policy • terms of condition</p>
    </div>
  </body>
</html>
`

const IdleLogo = () => (
  <svg
    className="h-10 w-auto"
    viewBox="0 0 120 70"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12 52V24c0-6.627 5.373-12 12-12h18c5.523 0 10 4.477 10 10v30H12Z" fill="#d9d9d9" />
    <path d="M108 52V24c0-6.627-5.373-12-12-12H78c-5.523 0-10 4.477-10 10v30h40Z" fill="#8d8f93" />
    <path d="M60 52c0-13.255-10.745-24-24-24H12v24h48Z" fill="#b8babc" opacity="0.75" />
    <path d="M60 52c0-13.255 10.745-24 24-24h24v24H60Z" fill="#7a7c80" opacity="0.8" />
  </svg>
)

export function IdlePage() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex flex-col justify-between px-6 sm:px-12 py-9">
      <div className="w-[86px] h-12">
        <IdleLogo />
      </div>

      <main className="flex flex-col gap-6 sm:gap-8 max-w-xl">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">Here is your site</h1>
        <p className="text-lg sm:text-2xl text-[#d2d4d8]">set up your website stile on the dasboard</p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full bg-[#5f636b] px-10 sm:px-12 py-3 text-2xl font-semibold text-white transition-colors hover:bg-[#6d727b] focus:outline-none focus:ring-2 focus:ring-[#6d727b] focus:ring-offset-2 focus:ring-offset-[#0f1115]"
        >
          return
        </a>
      </main>

      <p className="text-sm sm:text-base text-[#c9c9c9] text-center">
        privacy and policy • terms of condition
      </p>
    </div>
  )
}
