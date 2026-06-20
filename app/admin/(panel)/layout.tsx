import { redirect } from "next/navigation";
import { getCurrentUser } from "../_lib/auth";
import { isDbConfigured } from "@/app/_lib/db/client";
import { AdminToastProvider } from "../_components/AdminToast";
import { Sidebar } from "../_components/Sidebar";
import { Topbar } from "../_components/Topbar";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  const dbReady = isDbConfigured();

  return (
    <AdminToastProvider>
      <div aria-hidden className="admin-aurora">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
      </div>
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-screen">
        <div className="hidden md:flex">
          <Sidebar role={user.role} />
        </div>
        <div className="flex flex-col min-w-0">
          <Topbar dbReady={dbReady} role={user.role} />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </AdminToastProvider>
  );
}
