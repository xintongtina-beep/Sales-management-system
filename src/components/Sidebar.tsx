import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  Mic, 
  Package, 
  CheckSquare, 
  Clock, 
  Sparkles,
  Pencil,
  LogOut,
  User
} from "lucide-react";
import { AppBrandConfig, UserProfile } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  todoCount: number;
  followUpAlertCount: number;
  brandConfig: AppBrandConfig;
  onOpenCustomizeName: () => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  todoCount, 
  followUpAlertCount,
  brandConfig,
  onOpenCustomizeName,
  currentUser,
  onLogout
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "数据大盘", icon: LayoutDashboard },
    { id: "customers", label: "客户管理", icon: Users },
    { id: "visits", label: "拜访与录音", icon: Mic, badge: "AI" },
    { id: "samples", label: "送样管理", icon: Package },
    { id: "todos", label: "待办事项", icon: CheckSquare, count: todoCount },
    { id: "followup", label: "回访跟进", icon: Clock, count: followUpAlertCount, alert: true },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-full shrink-0" id="sidebar-container">
      {/* Brand Header */}
      <div 
        className="p-5 border-b border-slate-800 flex items-center justify-between group cursor-pointer hover:bg-slate-800/50 transition-colors" 
        id="brand-header"
        onClick={onOpenCustomizeName}
        title="点击自定义软件名称"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/10 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <h1 className="font-sans font-bold tracking-tight text-base leading-tight truncate text-white group-hover:text-sky-300 transition-colors">
                {brandConfig.name}
              </h1>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block truncate mt-0.5">
              {brandConfig.subtitle}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCustomizeName();
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-700/80 text-slate-400 hover:text-white transition-all shrink-0"
          title="自定义软件名称"
          id="btn-edit-sidebar-app-name"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" id="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 text-sm font-medium group ${
                isActive 
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/10" 
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                <span>{item.label}</span>
              </div>

              {/* Badges / Counters */}
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
              {item.count !== undefined && item.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono leading-none ${
                  isActive 
                    ? "bg-sky-600 text-white" 
                    : item.alert 
                      ? "bg-amber-500/10 text-amber-500 font-bold" 
                      : "bg-slate-800 text-slate-400"
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Profile Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between" id="sidebar-profile">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white border border-slate-700 flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
            {currentUser?.name ? currentUser.name.slice(0, 1) : <User className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
              {currentUser?.name || "未登录"}
            </p>
            <p className="text-[10px] font-mono text-slate-400 truncate leading-none mt-1">
              {currentUser?.account || "访客模式"}
            </p>
          </div>
        </div>

        {currentUser && (
          <button
            type="button"
            onClick={onLogout}
            id="btn-sidebar-logout"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors shrink-0"
            title="退出登录 / 切换账号"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
