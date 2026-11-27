import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Storefront PoC",
  description: "Walking skeleton storefront backed by a private GraphQL BFF",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/products">Products</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
