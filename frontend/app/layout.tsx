import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reflog | Founder's AI Council",
  description: "Brutally honest AI advisory board for founders.",
};

import Providers from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        elements: {
          card: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton: 'bg-gray-800 border-gray-700 hover:bg-gray-700',
          formFieldInput: 'bg-gray-800 border-gray-700 text-white',
          footerActionLink: 'text-blue-400 hover:text-blue-300',
        },
      }}
    >
      <html lang="en">
        <body className={cn(inter.className, "bg-[#000000] text-[#FBFAEE] antialiased")}>
          <Providers>
            <div className="flex h-screen overflow-hidden bg-[#000000]">
              <Sidebar />
              <main className="flex-1 overflow-y-auto relative">
                {/* Background effects */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#933DC9]/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#53118F]/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 p-8">
                  {children}
                </div>
              </main>
            </div>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}