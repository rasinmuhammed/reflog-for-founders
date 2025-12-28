import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reflog | Executive Intelligence",
  description: "Your Executive Intelligence. Strategic tracking and decision support for founders.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
        variables: {
          colorPrimary: '#469BA7', // Sea Sparkle
          colorBackground: '#023542', // Abyssal/Card dark
          colorText: '#F1F3F9', // Boysenberry
          colorInputBackground: '#012731', // Daintree
          colorInputText: '#F1F3F9',
        },
        elements: {
          card: 'bg-[#023542] border border-[#469BA7]/20 shadow-xl',
          headerTitle: 'text-[#F1F3F9]',
          headerSubtitle: 'text-[#F1F3F9]/60',
          socialButtonsBlockButton: 'bg-[#012731] border border-[#469BA7]/20 hover:bg-[#004d5a] text-[#F1F3F9]',
          formFieldInput: 'bg-[#012731] border border-[#469BA7]/20 text-[#F1F3F9] focus:border-[#469BA7]',
          footerActionLink: 'text-[#469BA7] hover:text-[#7BC0C9]',
          formButtonPrimary: 'bg-[#469BA7] hover:bg-[#3FA0AD] text-[#012731] font-medium border-none',
          navbar: 'hidden', // Hide default clerk navbar if any
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}