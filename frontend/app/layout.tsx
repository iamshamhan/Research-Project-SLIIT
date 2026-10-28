import type { ReactNode } from "react";
import "./style.css";
export const metadata = {
  title: "SignBridge | Healthcare Communication",
  description: "Sri Lankan Sign Language communication for healthcare settings",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
