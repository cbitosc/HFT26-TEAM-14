import "./globals.css";
import SiteNav from "@/components/SiteNav";
import { ProfileProvider } from "@/lib/profile-context";

export const metadata = {
  title: "CareerFit AI",
  description: "AI-powered resume tailoring and career fit platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ProfileProvider>
          <SiteNav />
          {children}
        </ProfileProvider>
      </body>
    </html>
  );
}
