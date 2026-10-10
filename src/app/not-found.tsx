import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="campus-card max-w-md p-6 text-center">
        <h1 className="text-xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The route you opened is unavailable.</p>
        <Link href="/home" className="mt-4 inline-block text-sm font-semibold text-blue-700">
          Go back home
        </Link>
      </div>
    </main>
  );
}
