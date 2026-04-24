export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen antialiased [background:var(--background)] [color:var(--foreground)]">{children}</div>;
}
