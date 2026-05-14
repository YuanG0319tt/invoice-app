import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Student Management Platform
        </h1>

        <div className="flex gap-4">
          <Link
            href="/calendar"
            className="text-blue-600 hover:underline"
          >
            Calendar
          </Link>

          <Link
            href="/students"
            className="text-blue-600 hover:underline"
          >
            Students
          </Link>

          <Link
            href="/invoice"
            className="text-blue-600 hover:underline"
          >
            Invoices
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <h2 className="text-5xl font-bold mb-6">
          Manage Students, Scheduling,
          and Invoices in One Place
        </h2>

        <p className="text-gray-600 text-lg mb-10 max-w-2xl">
          A full-stack teaching management
          platform built with Next.js,
          Prisma, and SQLite.
        </p>

        <div className="flex gap-4">
          <Link
            href="/calendar"
            className="bg-black text-white px-6 py-3 rounded-xl"
          >
            Open Calendar
          </Link>

          <Link
            href="/students"
            className="border px-6 py-3 rounded-xl"
          >
            Manage Students
          </Link>
        </div>
      </section>

      {/* Dashboard Cards */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-20">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-2">
            Student Management
          </h3>

          <p className="text-gray-600">
            Store and manage student
            information.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-2">
            Class Scheduling
          </h3>

          <p className="text-gray-600">
            Schedule and track student
            classes.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-2">
            Invoice System
          </h3>

          <p className="text-gray-600">
            Generate invoices from
            completed sessions.
          </p>
        </div>
      </section>
    </main>
  );
}