import {
  Briefcase,
  Settings2,
  User2,
  Wallet,
  GraduationCap,
  PenTool,
  Star,
} from "lucide-react";
import type { FC } from "react";

interface SidebarProps {
  currentSection: "jobs" | "profile" | "preferences" | "earnings";
}

const navItems: Array<{
  id: SidebarProps["currentSection"];
  label: string;
  icon: FC<{ className?: string }>;
}> = [
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "profile", label: "Profile", icon: User2 },
  { id: "preferences", label: "Preferences", icon: Settings2 },
  { id: "earnings", label: "Earnings", icon: Wallet },
];

export function Sidebar({ currentSection }: SidebarProps) {
  return (
    <aside className="flex h-full w-[20rem] flex-col  bg-[#f7f8fa] px-6 py-5">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-l from-white via-[#ec7f62] to-[#ff6b4a] text-white"></div>
        <span className="text-[18px] font-semibold tracking-tight text-[#111827] italic">
          <span className="font-normal">ikig</span>AI
        </span>
      </div>

      <nav className="space-y-1 text-sm font-medium text-[#c5c9d5]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`flex w-full items-center cursor-pointer gap-2 rounded-full px-3 py-2 text-left transition-colors ${
                isActive
                  ? "bg-white text-[#111827] shadow-sm"
                  : "hover:bg-white/60 hover:text-[#4b5563]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <div className="rounded-2xl bg-white px-3 py-3 shadow-sm">
   
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <User2 className="h-3 w-3 text-[#9ca3af]" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <GraduationCap className="h-3 w-3 text-[#9ca3af]" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Briefcase className="h-3 w-3 text-[#9ca3af]" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <PenTool className="h-3 w-3 text-[#9ca3af]" />
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-[#fca5a5] bg-[#fef2f2] px-2 py-1">
              <span className="h-1 w-1 rounded-full bg-[#ef4444]" />
              <span className="text-[10px] font-semibold uppercase text-[#ef4444]">
                NOT LIVE
              </span>
            </div>
          </div>


          <div className="flex items-center gap-2">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-[#e5e7eb]"></div>
            <div className="flex-1">
              <div className="text-xs font-medium text-[#111827]">
                Snehaa Gupta
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium text-[#111827]">$0</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
