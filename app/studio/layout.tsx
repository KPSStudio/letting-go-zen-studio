// app/studio/layout.tsx
// The Studio needs its own layout without the site nav/footer
// Sanity Studio renders its own full UI

export default function StudioLayout({
                                         children,
                                     }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    )
}