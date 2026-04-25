import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "FannsPanel — VM Management Dashboard",
  description: "Manage and monitor your Proxmox VMs with ease. Start, stop, reboot virtual machines and track performance metrics in real-time.",
  keywords: ["proxmox", "vm", "dashboard", "management", "monitoring"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
