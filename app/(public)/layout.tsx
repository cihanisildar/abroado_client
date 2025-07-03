import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gurbetci - Join the Community",
  description: "Connect with people living abroad",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
