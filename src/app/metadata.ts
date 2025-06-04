import type { Metadata } from "next";
 
export const metadata: Metadata = {
  title: "Invoicely",
  description: "A simple invoice management application",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Invoicely",
  },
}; 