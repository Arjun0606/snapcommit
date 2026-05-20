import Link from "next/link";

export function ProjectSidebar({
  projects,
  active,
}: {
  projects: { name: string; count: number }[];
  active?: string;
}) {
  return (
    <nav className="text-sm">
      <Link
        href="/"
        className={`block py-1.5 px-2 rounded text-xs ${
          !active ? "bg-[var(--border)] text-[var(--fg)]" : "text-[var(--muted)] hover:text-[var(--fg)]"
        }`}
      >
        All
      </Link>
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mt-6 mb-2 px-2">
        Projects
      </p>
      {projects.length === 0 ? (
        <p className="text-xs text-[var(--muted)] px-2">No projects yet</p>
      ) : (
        projects.map((p) => (
          <Link
            key={p.name}
            href={`/?project=${encodeURIComponent(p.name)}`}
            className={`flex justify-between items-center py-1.5 px-2 rounded text-xs ${
              active === p.name
                ? "bg-[var(--border)] text-[var(--fg)]"
                : "text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            <span className="truncate">{p.name}</span>
            <span className="text-[10px] text-[var(--muted)]">{p.count}</span>
          </Link>
        ))
      )}
    </nav>
  );
}
