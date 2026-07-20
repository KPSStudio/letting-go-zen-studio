// app/studio/layout.tsx
// The Studio has no site nav/footer — Sanity renders its own full UI.
// No <html>/<body> here; the root layout owns those for every route.

export default function StudioLayout({
                                         children,
                                     }: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
