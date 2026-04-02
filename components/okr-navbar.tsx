"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutGrid, PanelsTopLeft, Users2 } from "lucide-react";
import { useIdentity } from "@/components/identity-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function OkrNavbar({ personalTaskCount }: { personalTaskCount: number }) {
  const { currentPerson, personnelList, setCurrentPerson } = useIdentity();
  const pathname = usePathname();

  const navItems = [
    { href: "/" as const, label: "部门大盘", icon: LayoutGrid },
    { href: "/workspace" as const, label: "我的工作台", icon: PanelsTopLeft }
  ];

  return (
    <header className="sticky top-0 z-30 px-4 pb-4 pt-5 sm:px-6 lg:px-10">
      <div className="glass-panel-strong mx-auto flex max-w-[1520px] flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-soft">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-caption">Internal OKR Workbench</p>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
                OKR 协同管理工作台
              </h1>
              <p className="text-sm text-zinc-500">
                首页优先展示部门大盘，个人工作台收纳到二级页面，O 和 KR 支持就地编辑。
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center rounded-2xl border px-4 py-2 text-sm font-medium transition",
                    active
                      ? "border-zinc-900/10 bg-zinc-900 text-white"
                      : "border-white/60 bg-white/70 text-zinc-600 hover:bg-white hover:text-zinc-950"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="glass-panel flex items-center gap-3 px-4 py-3">
            <Users2 className="h-4 w-4 text-zinc-500" />
            <div>
              <p className="text-caption">当前身份</p>
              <p className="text-sm font-medium text-zinc-900">
                {currentPerson} · 参与 {personalTaskCount} 项 KR
              </p>
            </div>
          </div>

          <div className="w-full min-w-[220px] sm:w-[260px]">
            <Select value={currentPerson} onValueChange={setCurrentPerson}>
              <SelectTrigger>
                <SelectValue placeholder="选择当前人员" />
              </SelectTrigger>
              <SelectContent>
                {personnelList.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </header>
  );
}
