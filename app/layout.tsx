// app/layout.tsx
// Root layout — required by Next.js
// next-intl handles the locale routing from here

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html>
        <body>{children}</body>
        </html>
    )
}