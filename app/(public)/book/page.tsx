import { prisma } from "@/lib/prisma";
import { pickUtmParams } from "@/lib/utm";
import { BookingForm } from "./components/BookingForm";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [settings, params] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "singleton" } }),
    searchParams,
  ]);
  const companyName = settings?.companyName ?? "us";
  const urlUtm = pickUtmParams(params);

  return (
    <div className="flex-1 bg-canvas">
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-heading text-2xl text-ink">
          Book an appointment with {companyName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tell us a bit about your project and pick a time that works for
          you.
        </p>

        <div className="mt-6 border border-line bg-surface p-6">
          <BookingForm companyName={companyName} urlUtm={urlUtm} />
        </div>
      </main>
    </div>
  );
}
