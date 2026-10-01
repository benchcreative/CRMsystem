import Link from "next/link";
import { createCustomer } from "../../actions";
import { CustomerForm } from "../../components/CustomerForm";
import { NotificationBell } from "../../components/NotificationBell";
import { getNotificationBellData } from "@/lib/notifications";

export default async function NewCustomerPage() {
  const { unreadCount, notifications } = await getNotificationBellData();

  return (
    <div className="flex-1 bg-dash-bg">
      <main className="mx-auto max-w-2xl px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/customers" className="text-sm text-dash-muted transition-colors hover:text-dash-ink">
              Back to customers
            </Link>
            <h1 className="mt-2 font-heading text-2xl text-dash-ink">Add customer</h1>
          </div>
          <NotificationBell unreadCount={unreadCount} notifications={notifications} />
        </div>

        <div className="mt-6 border border-dash-line bg-dash-surface p-6">
          <CustomerForm
            action={createCustomer}
            submitLabel="Add customer"
            defaultValues={{ status: "new", jobStatus: "not_scheduled" }}
          />
        </div>
      </main>
    </div>
  );
}
