import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ChatWidget } from "@/components/chat/ChatWidget";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SiteHeader />
      <div className="min-w-0 flex-1 overflow-auto">
        {children}
        <SiteFooter />
      </div>
      <ChatWidget />
    </div>
  );
}
