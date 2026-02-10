import { getWaitlistEntries } from "@/lib/waitlistStorage";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = {
  key?: string;
};

function formatTimestamp(ts: string) {
  if (!ts) return "Unknown";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return ts;
  return date.toLocaleString();
}

export default async function WaitlistAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const adminKey = process.env.WAITLIST_ADMIN_KEY;
  const providedKey = searchParams?.key ?? "";

  if (!adminKey) {
    return (
      <main className="min-h-screen bg-neutral-bg dark:bg-dark-bg px-6 py-24">
        <div className="max-w-3xl mx-auto bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-3">
            Waitlist Admin
          </h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">
            Set `WAITLIST_ADMIN_KEY` to view entries here.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-accent-primary transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (providedKey !== adminKey) {
    return (
      <main className="min-h-screen bg-neutral-bg dark:bg-dark-bg px-6 py-24">
        <div className="max-w-3xl mx-auto bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-3">
            Unauthorized
          </h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">
            Missing or invalid access key.
          </p>
        </div>
      </main>
    );
  }

  const entries = await getWaitlistEntries();
  const sorted = [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <main className="min-h-screen bg-neutral-bg dark:bg-dark-bg px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">
            Waitlist Entries
          </h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">
            Total: {sorted.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
            For production persistence, set `WAITLIST_STORAGE_DIR` or forward to a backend.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-dark-border">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700 dark:text-dark-text-primary">
                    Name
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 dark:text-dark-text-primary">
                    Email
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 dark:text-dark-text-primary">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-gray-500 dark:text-dark-text-secondary"
                    >
                      No entries yet.
                    </td>
                  </tr>
                ) : (
                  sorted.map((entry, index) => (
                    <tr
                      key={`${entry.email}-${index}`}
                      className="border-b border-gray-100 dark:border-dark-border"
                    >
                      <td className="px-6 py-4 text-gray-900 dark:text-dark-text-primary">
                        {entry.name}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-dark-text-secondary">
                        {entry.email}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-dark-text-secondary">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
