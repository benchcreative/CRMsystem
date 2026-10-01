import { prisma } from "@/lib/prisma";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  return (
    <>
      <header className="border-b border-line px-6 py-3">
        <span className="font-heading text-sm text-ink">
          {settings?.companyName ?? "Company name not set"}
        </span>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
