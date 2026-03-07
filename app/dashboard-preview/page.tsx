import { SitePreviewDashboard } from "@/components/site-preview-dashboard"

export const metadata = {
  title: "Site Dashboard Preview",
  description: "Preview of your live website dashboard.",
}

export default function DashboardPreviewPage() {
  return (
    /*
      Outer shell replicates the deep-black phone chrome from the photo.
      The inner max-w-sm card is the phone body / dashboard viewport.
    */
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: "#111111" }}
    >
      <div className="w-full max-w-sm shadow-2xl rounded-[28px] overflow-hidden ring-1 ring-white/5">
        <SitePreviewDashboard
          siteName="Ok"
          domain="Domain.com"
          isLive={true}
          userInitial="D"
          quickCards={[{ id: "a" }, { id: "b" }, { id: "c" }]}
        />
      </div>
    </div>
  )
}
