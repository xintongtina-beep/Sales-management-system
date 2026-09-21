import React, { useState, useMemo, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import CustomerView from "./components/CustomerView";
import VisitView from "./components/VisitView";
import SampleView from "./components/SampleView";
import TaskView from "./components/TaskView";
import FollowUpView from "./components/FollowUpView";
import CustomizeAppNameModal from "./components/CustomizeAppNameModal";
import AuthView from "./components/AuthView";
import { Customer, VisitRecord, SampleRecord, TodoTask, FollowUpAlert, AppBrandConfig, UserProfile } from "./types";
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_VISITS, 
  INITIAL_SAMPLES, 
  INITIAL_TODOS 
} from "./mockData";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Pencil, LogOut, User } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // User Authentication State (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("crm_auth_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.account) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load saved auth user:", e);
    }
    // Default to null so user can experience registration & login flow
    return null;
  });

  const handleLoginSuccess = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("crm_auth_user", JSON.stringify(user));
      localStorage.setItem("crm_auth_token", token);
    } catch (e) {
      console.error("Failed to persist auth session:", e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("crm_auth_user");
      localStorage.removeItem("crm_auth_token");
    } catch (e) {
      console.error("Failed to clear auth session:", e);
    }
  };

  // App Brand Configuration (Software Name and Subtitle, persisted to localStorage)
  const [brandConfig, setBrandConfig] = useState<AppBrandConfig>(() => {
    try {
      const saved = localStorage.getItem("crm_brand_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === "string" && parsed.name.trim()) {
          return {
            name: parsed.name.trim(),
            subtitle: parsed.subtitle?.trim() || "Anker AI Powered"
          };
        }
      }
    } catch (e) {
      console.warn("Failed to load saved brand config:", e);
    }
    return {
      name: "销售管家",
      subtitle: "Anker AI Powered"
    };
  });

  const [isCustomizeNameOpen, setIsCustomizeNameOpen] = useState(false);

  // Sync document title when software name changes
  useEffect(() => {
    document.title = `${brandConfig.name} - 销售与拜访管理系统`;
  }, [brandConfig.name]);

  const handleSaveBrandConfig = (newConfig: AppBrandConfig) => {
    setBrandConfig(newConfig);
    try {
      localStorage.setItem("crm_brand_config", JSON.stringify(newConfig));
    } catch (e) {
      console.error("Failed to persist brand config:", e);
    }
  };

  // Core Data States
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [visits, setVisits] = useState<VisitRecord[]>(INITIAL_VISITS);
  const [samples, setSamples] = useState<SampleRecord[]>(INITIAL_SAMPLES);
  const [todos, setTodos] = useState<TodoTask[]>(INITIAL_TODOS);
  const [focusedCustomerId, setFocusedCustomerId] = useState<string | null>(null);

  // Dynamic Alert Calculation based on Current Time (fixed mock time is 2026-07-06)
  const followUpAlerts = useMemo((): FollowUpAlert[] => {
    const today = new Date("2026-07-06");
    return customers.map(c => {
      const nextDateStr = c.nextFollowUp || "";
      const nextDate = new Date(nextDateStr);
      const diffTime = nextDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let status: "overdue" | "due_today" | "upcoming" = "upcoming";
      if (diffDays < 0) status = "overdue";
      else if (diffDays === 0) status = "due_today";

      return {
        id: `alert-${c.id}`,
        customerId: c.id,
        customerName: c.name,
        daysRemaining: diffDays,
        lastFollowUpDate: c.lastFollowUp,
        nextFollowUpDate: nextDateStr,
        status
      };
    });
  }, [customers]);

  // Count active reminders
  const activeAlertCount = useMemo(() => {
    return followUpAlerts.filter(a => a.status === "overdue" || a.status === "due_today").length;
  }, [followUpAlerts]);

  // Count active pending tasks
  const pendingTaskCount = useMemo(() => {
    return todos.filter(t => !t.isCompleted).length;
  }, [todos]);

  // Callbacks
  const handleAddCustomer = (newCust: Customer) => {
    setCustomers(prev => [newCust, ...prev]);
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setSamples(prev => prev.filter(s => s.customerId !== id));
    setTodos(prev => prev.filter(t => t.customerId !== id));
    setVisits(prev => prev.filter(v => v.customerId !== id));
  };

  const handleAddVisit = (newVisit: VisitRecord) => {
    setVisits(prev => [newVisit, ...prev]);
    // Also, when a visit occurs, let's update the customer's lastFollowUp and nextFollowUp dates automatically!
    setCustomers(prev => prev.map(c => {
      if (c.id === newVisit.customerId) {
        const nextDate = new Date(new Date(newVisit.date).getTime() + c.followUpCycle * 24 * 60 * 60 * 1000);
        return {
          ...c,
          lastFollowUp: newVisit.date,
          nextFollowUp: nextDate.toISOString().split("T")[0]
        };
      }
      return c;
    }));
  };

  const handleAddTodo = (newTodo: TodoTask) => {
    setTodos(prev => [newTodo, ...prev]);
  };

  const handleToggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const handleAddSample = (newSample: SampleRecord) => {
    setSamples(prev => [newSample, ...prev]);
  };

  const handleUpdateSample = (updatedSample: SampleRecord) => {
    setSamples(prev => prev.map(s => s.id === updatedSample.id ? updatedSample : s));
  };

  // Record custom simple follow-up
  const handleTriggerCheckIn = (customerId: string, date: string, note: string) => {
    // Add manual visit for follow-up record
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    handleAddVisit({
      id: `visit-chk-${Date.now()}`,
      customerId,
      customerName: cust.name,
      date,
      salesperson: "张经理",
      title: "日常例行回访与客诉确认",
      source: "Manual",
      aiSummary: {
        painPoints: "常规周期回访。",
        consensus: "客户使用平稳，无紧急技术或交付阻碍。",
        actions: `1. 记录日常回访纪要；\n2. 回访备忘内容：${note || "无特别备忘"}`
      }
    });
  };

  // View dispatch
  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            customers={customers}
            visits={visits}
            samples={samples}
            todos={todos}
            followUpAlerts={followUpAlerts}
            setActiveTab={setActiveTab}
            onFocusCustomer={(id) => {
              setFocusedCustomerId(id);
              setActiveTab("customers");
            }}
          />
        );
      case "customers":
        return (
          <CustomerView
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            initialSelectedCustomerId={focusedCustomerId}
            onClearFocusCustomerId={() => setFocusedCustomerId(null)}
          />
        );
      case "visits":
        return (
          <VisitView
            visits={visits}
            customers={customers}
            onAddVisit={handleAddVisit}
            onAddTodo={handleAddTodo}
            onAddSample={handleAddSample}
          />
        );
      case "samples":
        return (
          <SampleView
            samples={samples}
            customers={customers}
            onAddSample={handleAddSample}
            onUpdateSample={handleUpdateSample}
          />
        );
      case "todos":
        return (
          <TaskView
            todos={todos}
            customers={customers}
            onToggleTodo={handleToggleTodo}
            onAddTodo={handleAddTodo}
            onDeleteTodo={handleDeleteTodo}
          />
        );
      case "followup":
        return (
          <FollowUpView
            customers={customers}
            followUpAlerts={followUpAlerts}
            onTriggerCheckIn={handleTriggerCheckIn}
          />
        );
      default:
        return null;
    }
  };

  // If not logged in, display the Authentication View (Register & Login with Phone / Email Verification Code)
  if (!currentUser) {
    return (
      <AuthView
        brandConfig={brandConfig}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased" id="app-root">
      {/* Sidebar Nav */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        todoCount={pendingTaskCount}
        followUpAlertCount={activeAlertCount}
        brandConfig={brandConfig}
        onOpenCustomizeName={() => setIsCustomizeNameOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace Stage */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" id="workspace-stage">
        {/* Universal Sub-Header */}
        <header className="h-16 border-b border-slate-200/80 bg-white flex items-center justify-between px-8 shrink-0 shadow-xs" id="workspace-header">
          <div className="flex items-center space-x-2">
            <h2 className="font-sans font-extrabold text-slate-800 text-sm tracking-tight capitalize">
              {activeTab === "dashboard" && "数据大盘 / Metrics Overview"}
              {activeTab === "customers" && "客户管理 / Customer Registry"}
              {activeTab === "visits" && "飞书录音豆与拜访 / Lark Anker Bud Sync"}
              {activeTab === "samples" && "送样管理 / Sample Delivery"}
              {activeTab === "todos" && "待处理事项 / Pending Sales Tasks"}
              {activeTab === "followup" && "定期回访跟进 / Regular Follow-up Reminders"}
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Custom Software Name Quick Tag / Edit Button */}
            <button
              type="button"
              id="btn-workspace-header-custom-name"
              onClick={() => setIsCustomizeNameOpen(true)}
              title="点击自定义软件名称与副标题"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-sky-600 bg-slate-50 hover:bg-sky-50/80 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-sky-300 transition-all cursor-pointer group shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-500 group-hover:scale-110 transition-transform" />
              <span>{brandConfig.name}</span>
              <Pencil className="w-3 h-3 text-slate-400 group-hover:text-sky-500 ml-0.5" />
            </button>

            <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-150">
              📅 当前业务基准日：2026-07-06
            </span>

            {/* Current Logged-in User Profile Badge & Logout */}
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-200" id="header-user-badge">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold text-xs shadow-2xs">
                {currentUser.name.slice(0, 1)}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 leading-none truncate max-w-[120px]">
                  {currentUser.role}
                </div>
              </div>
              <button
                type="button"
                id="btn-header-logout"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Tab Canvas Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8" id="workspace-main">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {renderActiveView()}
          </motion.div>
        </main>
      </div>

      {/* Customize Software Name Modal */}
      <CustomizeAppNameModal
        isOpen={isCustomizeNameOpen}
        onClose={() => setIsCustomizeNameOpen(false)}
        brandConfig={brandConfig}
        onSave={handleSaveBrandConfig}
      />
    </div>
  );
}
