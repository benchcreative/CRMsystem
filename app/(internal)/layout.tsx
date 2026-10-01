import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { Sidebar, SidebarFallback } from "./components/Sidebar";

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  const companyName = settings?.companyName ?? "Dashboard";

  return (
    <div className="flex min-h-screen flex-1 bg-dash-bg">
      {/* Sidebar reads ?view= (via useSearchParams) to tell the Leads and
          Customers nav items apart, which requires a Suspense boundary. */}
      <Suspense fallback={<SidebarFallback companyName={companyName} />}>
        <Sidebar companyName={companyName} />
      </Suspense>
      <div className="flex-1">{children}</div>
    </div>
  );
}
