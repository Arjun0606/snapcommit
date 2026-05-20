export function EmptyState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-medium mb-2">Snapcommit</h1>
        <p className="text-sm text-[var(--muted)] mb-8">
          Local-first memory for your AI tools
        </p>

        <div className="text-left border border-[var(--border)] rounded p-5 text-sm">
          <p className="mb-3 text-[var(--muted)]">
            Snapcommit isn't installed yet. Run this in your terminal:
          </p>
          <pre className="bg-black p-3 rounded font-mono text-xs overflow-x-auto">
            npx @snapcommit/install
          </pre>
          <p className="mt-4 text-xs text-[var(--muted)]">
            That detects Claude Code, Cursor, Claude Desktop, Cline, and Windsurf — and wires
            Snapcommit into each. Start using your AI tools normally; memories appear here as
            they're saved.
          </p>
        </div>
      </div>
    </div>
  );
}
