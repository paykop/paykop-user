import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
      <h2 className="text-2xl font-black text-gray-900 tracking-tight">Page not found</h2>
      <p className="text-sm text-gray-500">
        The page you requested does not exist or may have been moved.
      </p>
      <Link
        href="/"
        className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary font-bold text-xs"
      >
        Back to home
      </Link>
    </div>
  );
}
