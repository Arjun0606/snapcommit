import { search, projects, total } from "@/lib/db";
import { MemoryList } from "@/components/MemoryList";
import { SearchBar } from "@/components/SearchBar";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const allProjects = projects();
  const totalCount = total();
  const memories = search(query, params.project, 200);

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-[var(--border)] p-6">
        <Link href="/" className="text-lg font-medium mb-1 block">
          Snapcommit
        </Link>
        <p className="text-xs text-[var(--muted)] mb-8">{totalCount} memories</p>
        <ProjectSidebar projects={allProjects} active={params.project} />
      </aside>

      <main className="flex-1 p-6 max-w-4xl">
        <SearchBar defaultValue={query} project={params.project} />
        <p className="text-xs text-[var(--muted)] mb-4">
          {memories.length} {memories.length === 1 ? "result" : "results"} for "{query}"
          {params.project ? ` in ${params.project}` : ""}
        </p>
        <MemoryList memories={memories} />
      </main>
    </div>
  );
}
