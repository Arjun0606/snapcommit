"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export function SearchBar({
  defaultValue,
  project,
}: {
  defaultValue: string;
  project?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      router.push(project ? `/?project=${encodeURIComponent(project)}` : "/");
      return;
    }
    const params = new URLSearchParams({ q: trimmed });
    if (project) params.set("project", project);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="mb-6">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Search memories${project ? ` in ${project}` : ""}…`}
        className="w-full bg-transparent border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] font-mono"
      />
    </form>
  );
}
