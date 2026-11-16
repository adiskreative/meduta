/**
 * Fallback route-level saat berpindah halaman admin. Tanpa ini, klik menu
 * admin tidak memberi tanda apa pun sampai data selesai dimuat dari server.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
      <div className="space-y-2">
        <div className="h-7 w-56 max-w-full rounded bg-zinc-200" />
        <div className="h-4 w-80 max-w-full rounded bg-zinc-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-2xl border border-zinc-200 bg-white" />
        <div className="h-24 rounded-2xl border border-zinc-200 bg-white" />
        <div className="h-24 rounded-2xl border border-zinc-200 bg-white" />
      </div>
      <div className="h-64 rounded-2xl border border-zinc-200 bg-white" />
      <span className="sr-only">Memuat halaman…</span>
    </div>
  );
}
