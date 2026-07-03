import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gray-200">404</h1>
        <p className="text-gray-500">Page not found</p>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          Go home
        </Link>
      </div>
    </div>
  );
}