import "./globals.css";

export const metadata = {
  title: "RK Vision ID Card Generator",
  description: "Dynamically generate press ID cards for RK Vision News TV",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
