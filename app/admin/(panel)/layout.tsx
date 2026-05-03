import { redirect } from "next/navigation";
import { isAuthed } from "../_lib/auth";
import { isDbConfigured } from "@/app/_lib/db/client";
import { AdminToastProvider } from "../_components/AdminToast";
import { Sidebar } from "../_components/Sidebar";
import { Topbar } from "../_components/Topbar";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthed())) redirect("/admin/login");
  const dbReady = isDbConfigured();

  return (
    <AdminToastProvider>
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-screen">
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <div className="flex flex-col min-w-0">
          <Topbar dbReady={dbReady} />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </AdminToastProvider>
  );
}
