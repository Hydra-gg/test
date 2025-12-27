import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    weight: ["100", "300", "400", "500", "700", "900"],
});

const playfair = Playfair_Display({
    variable: "--font-playfair",
    subsets: ["latin"],
    weight: ["400", "700", "900"],
    style: ["normal", "italic"],
});

export const metadata: Metadata = {
    title: "Escalate | Install AI to your Business!",
    description: "Escalate is a Growth Agency powered by proprietary AI systems. We scale your marketing while you focus on the business.",
    keywords: ["AI", "growth agency", "marketing automation", "business scaling", "AI marketing"],
    openGraph: {
        title: "Escalate | Install AI to your Business!",
        description: "Scale with Precision. Dominate with AI.",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${inter.variable} ${playfair.variable} font-sans antialiased noise`}
            >
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
