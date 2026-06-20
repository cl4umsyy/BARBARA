import React from "react";

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gray-light">
          Admin Panel
        </p>
        <h1 className="mt-2 text-3xl font-bold uppercase tracking-wider md:text-4xl">
          Customers
        </h1>
        <p className="mt-1 text-sm text-brand-gray-light">
          Manage and view your registered customer directory.
        </p>
      </div>

      <div className="border border-brand-light bg-brand-white p-12 text-center text-xs font-bold tracking-widest text-brand-gray-light uppercase">
        Customer Directory (Coming Soon)
      </div>
    </div>
  );
}
