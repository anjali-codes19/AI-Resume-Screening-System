import type { PropsWithChildren } from "react";

import type { UserRole } from "../types";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps extends PropsWithChildren {
  role: UserRole;
  title: string;
  subtitle: string;
}

export function AppShell({
  role,
  title,
  subtitle,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar role={role} />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
            <TopBar title={title} subtitle={subtitle} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
