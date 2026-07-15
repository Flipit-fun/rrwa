import type { Metadata } from "next";
import { Instrument_Serif, Instrument_Sans } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import Providers from "./providers";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "RRWA — Robin Real World Assets",
  description:
    "A marketplace where real assets are funded by real people. List a property to raise capital — or fund one, and earn a fixed APY paid from rent secured through RRWA.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const initialState = cookieToInitialState(
    wagmiConfig,
    headersList.get("cookie")
  );

  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${instrumentSans.variable}`}
    >
      <body>
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
