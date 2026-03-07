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
        background: #0f1013;
        color: #f5f5f5;
        font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
      }
      .page {
        position: relative;
        min-height: 100vh;
        background: #0f1013;
        overflow: hidden;
      }
      .logo {
        position: absolute;
        top: 48px;
        left: 32px;
        width: 72px;
        height: 40px;
      }
      .content {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 32px;
        padding: 0 32px;
        max-width: 760px;
      }
      h1 {
        margin: 0;
        font-size: 40px;
        line-height: 1.1;
        font-weight: 700;
      }
      p {
        margin: 0;
      }
      .subtitle {
        color: #d6d6d6;
        font-size: 21px;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 46px;
        border-radius: 999px;
        background: #66686f;
        color: #f5f5f5;
        font-size: 22px;
        font-weight: 700;
        text-decoration: none;
        transition: background 0.2s ease, transform 0.2s ease;
      }
      .button:hover {
        background: #7a7c84;
        transform: translateY(-1px);
      }
      .footer {
        position: absolute;
        bottom: 34px;
        left: 50%;
        transform: translateX(-50%);
        color: #c9c9c9;
        font-size: 14px;
        white-space: nowrap;
      }
      @media (min-width: 768px) {
        .content { padding: 0 72px; }
        h1 { font-size: 48px; }
        .subtitle { font-size: 23px; }
        .button { font-size: 24px; padding: 16px 56px; }
        .footer { font-size: 15px; }
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

      <main class="content">
        <div>
          <h1>Here is your site</h1>
          <p class="subtitle">set up your website stile on the dasboard</p>
        </div>
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
    <div className="relative min-h-screen bg-[#0f1013] text-white overflow-hidden">
      <div className="absolute left-6 top-12 sm:left-12">
        <IdleLogo />
      </div>

      <div className="flex min-h-screen flex-col justify-center gap-10 px-6 sm:px-12">
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">Here is your site</h1>
          <p className="text-xl sm:text-2xl text-[#d6d6d6]">
            set up your website stile on the dasboard
          </p>
        </div>

        <a
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full bg-[#66686f] px-10 sm:px-12 py-3 text-2xl font-semibold text-white transition-colors hover:bg-[#7a7c84] focus:outline-none focus:ring-2 focus:ring-[#7a7c84] focus:ring-offset-2 focus:ring-offset-[#0f1013]"
        >
          return
        </a>
      </div>

      <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-sm sm:text-base text-[#c9c9c9]">
        privacy and policy • terms of condition
      </p>
    </div>
  )
}
