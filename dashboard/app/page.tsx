import { recent, projects, total, isInstalled } from "@/lib/db";
import { MemoryList } from "@/components/MemoryList";
import { SearchBar } from "@/components/SearchBar";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; q?: string }>;
}) {
  const params = await searchParams;
  const installed = isInstalled();

  if (!installed) {
    return <EmptyState />;
  }

  const allProjects = projects();
  const totalCount = total();
  const memories = recent(params.project, 100);

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-[var(--border)] p-6">
        <h1 className="text-lg font-medium mb-1">Snapcommit</h1>
        <p className="text-xs text-[var(--muted)] mb-8">{totalCount} memories</p>
        <ProjectSidebar projects={allProjects} active={params.project} />
      </aside>

      <main className="flex-1 p-6 max-w-4xl">
        <SearchBar defaultValue={params.q ?? ""} project={params.project} />
        <MemoryList memories={memories} />
      </main>
    </div>
  );
}
