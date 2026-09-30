import type { Metadata } from "next";
import Link from "next/link";
import "./styles.css";

export const metadata: Metadata = {
  title: "SourcePay | Pay the source",
  description: "Paste something that gave you value. Find its source. Pay it.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><div className="site-shell"><header className="site-header"><Link href="/" className="brand"><span className="brand-mark">s</span><span>sourcepay</span></Link><span className="header-note">Value travels back.</span></header>{children}<footer className="site-footer"><span>SourcePay</span><span>Pay the source.</span></footer></div></body></html>;
}
