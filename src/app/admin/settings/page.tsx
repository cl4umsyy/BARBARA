import React from "react";
import { SettingsFormClient } from "@/components/admin/SettingsFormClient";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gray-light">
          Admin Panel
        </p>
        <h1 className="mt-2 text-3xl font-bold uppercase tracking-wider md:text-4xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-brand-gray-light">
          Manage system configurations, store parameters, and payment status mappings.
        </p>
      </div>

      <div className="mt-6">
        <SettingsFormClient />
      </div>
    </div>
  );
}
