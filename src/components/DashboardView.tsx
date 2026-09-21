import React, { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Mic, 
  Package, 
  AlertCircle, 
  TrendingUp, 
  Building2, 
  ChevronRight, 
  CheckCircle2, 
  ArrowUpRight 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  Legend
} from "recharts";

interface SafeResponsiveContainerProps {
  children: (width: number, height: number) => React.ReactNode;
}

function SafeResponsiveContainer({ children }: SafeResponsiveContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(containerRef.current);

    const rect = containerRef.current.getBoundingClientRect();
    setDimensions({ width: rect.width || 300, height: rect.height || 200 });

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative min-h-[100px]">
      {dimensions.width > 0 && dimensions.height > 0 && children(dimensions.width, dimensions.height)}
    </div>
  );
}
import { Customer, VisitRecord, SampleRecord, TodoTask, FollowUpAlert } from "../types";
import { motion } from "motion/react";
import MapVisualization from "./MapVisualization";

interface DashboardViewProps {
  customers: Customer[];
  visits: VisitRecord[];
  samples: SampleRecord[];
  todos: TodoTask[];
  followUpAlerts: FollowUpAlert[];
  setActiveTab: (tab: string) => void;
  onFocusCustomer?: (customerId: string) => void;
}

export default function DashboardView({
  customers,
  visits,
  samples,
  todos,
  followUpAlerts,
  setActiveTab,
  onFocusCustomer
}: DashboardViewProps) {
  // 1. Calculate KPI Metrics
  const totalCustomers = customers.length;
  const feishuVisits = visits.filter(v => v.source === "FeishuAnker").length;
  const totalSamples = samples.length;
  const overdueFollowUps = followUpAlerts.filter(a => a.status === "overdue").length;
  const pendingTodos = todos.filter(t => !t.isCompleted).length;

  // 2. Prepare Chart Data
  // Industry distribution
  const industryMap: { [key: string]: number } = {};
  customers.forEach(c => {
    industryMap[c.industry] = (industryMap[c.industry] || 0) + 1;
  });
  const industryData = Object.keys(industryMap).map(name => ({
    name,
    value: industryMap[name]
  }));

  const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

  // Sample status
  const sampleStatusMap = {
    preparing: 0,
    shipped: 0,
    received: 0,
    feedback: 0
  };
  samples.forEach(s => {
    sampleStatusMap[s.status] = (sampleStatusMap[s.status] || 0) + 1;
  });
  const sampleStatusData = [
    { name: "准备中", value: sampleStatusMap.preparing, color: "#94a3b8" },
    { name: "已寄出", value: sampleStatusMap.shipped, color: "#0ea5e9" },
    { name: "已签收", value: sampleStatusMap.received, color: "#8b5cf6" },
    { name: "反馈完毕", value: sampleStatusMap.feedback, color: "#10b981" }
  ].filter(item => item.value > 0);

  // Default fallback if no data in list yet
  const displaySampleStatusData = sampleStatusData.length > 0 ? sampleStatusData : [
    { name: "准备中", value: 1, color: "#94a3b8" },
    { name: "已寄出", value: 2, color: "#0ea5e9" },
    { name: "已签收", value: 1, color: "#8b5cf6" },
    { name: "反馈完毕", value: 2, color: "#10b981" }
  ];

  // Visit trend monthly
  const visitTrendData = [
    { month: "1月", 传统拜访: 4, 飞书录音智能分析: 0 },
    { month: "2月", 传统拜访: 5, 飞书录音智能分析: 0 },
    { month: "3月", 传统拜访: 6, 飞书录音智能分析: 1 },
    { month: "4月", 传统拜访: 8, 飞书录音智能分析: 3 },
    { month: "5月", 传统拜访: 5, 飞书录音智能分析: 6 },
    { month: "6月", 传统拜访: 3, 飞书录音智能分析: 8 },
    { month: "7月 (本月)", 传统拜访: 1, 飞书录音智能分析: feishuVisits }
  ];

  // Container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      id="dashboard-view-root"
    >
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="welcome-banner">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight">下午好，张经理</h2>
          <p className="text-xs text-slate-500 mt-1">今天有 <span className="text-sky-500 font-semibold">{pendingTodos} 个未决待办</span> 和 <span className="text-amber-500 font-semibold">{overdueFollowUps} 个超期未跟进的客户</span> 正在等待您处理。</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <button 
            onClick={() => setActiveTab("visits")}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>同步安克录音豆</span>
          </button>
          <button 
            onClick={() => setActiveTab("customers")}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            <span>新增客户</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
        {/* KPI 1 */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-sky-200 transition-colors">
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-medium">客户管辖总数</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-slate-800 font-mono">{totalCustomers}</span>
              <span className="text-[10px] text-emerald-500 font-semibold flex items-center bg-emerald-50 px-1 rounded">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                +25%
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors duration-300">
            <Users className="w-5 h-5" />
          </div>
        </motion.div>

        {/* KPI 2 */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-pink-200 transition-colors">
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-medium">智能拜访录音数</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-slate-800 font-mono">{feishuVisits}</span>
              <span className="text-[10px] text-pink-500 font-semibold bg-pink-50 px-1.5 rounded">
                飞书安克
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-colors duration-300">
            <Mic className="w-5 h-5" />
          </div>
        </motion.div>

        {/* KPI 3 */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-colors">
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-medium">送样跟进总数</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-slate-800 font-mono">{totalSamples}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                本月活跃
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
            <Package className="w-5 h-5" />
          </div>
        </motion.div>

        {/* KPI 4 */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-colors">
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-medium">超期未回访预警</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-slate-800 font-mono">{overdueFollowUps}</span>
              <span className={`text-[10px] font-semibold px-1 rounded ${overdueFollowUps > 0 ? "text-amber-600 bg-amber-50" : "text-slate-400 bg-slate-50"}`}>
                需紧急跟进
              </span>
            </div>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-300 ${overdueFollowUps > 0 ? "bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white" : "bg-slate-50 text-slate-400"}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Map Visualization Section */}
      <motion.div variants={itemVariants} className="w-full">
        <MapVisualization
          customers={customers}
          visits={visits}
          samples={samples}
          todos={todos}
          onFocusCustomer={onFocusCustomer}
        />
      </motion.div>

      {/* Chart Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-grid">
        {/* Left Side: Visit trends bar chart */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">月度拜访趋势 (2026年)</h3>
              <p className="text-[10px] text-slate-400">记录销售传统的跟进与融合飞书AI录音豆的统计对比</p>
            </div>
            <span className="text-xs font-mono text-indigo-500 font-medium bg-indigo-50 px-2 py-1 rounded-lg">AI 渗透率快速提升</span>
          </div>
          <div className="h-64">
            <SafeResponsiveContainer>
              {(width, height) => (
                <BarChart width={width} height={height} data={visitTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }} 
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Legend iconSize={10} verticalAlign="top" height={32} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="传统拜访" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={16} isAnimationActive={false} />
                  <Bar dataKey="飞书录音智能分析" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={16} isAnimationActive={false} />
                </BarChart>
              )}
            </SafeResponsiveContainer>
          </div>
        </motion.div>

        {/* Right Side: Sample & Industry Pie Chart */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">销售送样状态分布</h3>
              <p className="text-[10px] text-slate-400">样品跟进全生命周期闭环占比</p>
            </div>
          </div>
          <div className="h-44 relative flex items-center justify-center">
            <SafeResponsiveContainer>
              {(width, height) => (
                <PieChart width={width} height={height}>
                  <Pie
                    data={displaySampleStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {displaySampleStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                </PieChart>
              )}
            </SafeResponsiveContainer>
            {/* Center Summary */}
            <div className="absolute text-center">
              <span className="text-xs text-slate-400 block font-medium">总送样量</span>
              <span className="text-xl font-bold text-slate-800 font-mono">{totalSamples}</span>
            </div>
          </div>
          {/* Custom Legends */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {displaySampleStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-500 truncate">{item.name}</span>
                <span className="text-slate-800 font-bold font-mono ml-auto">{item.value}件</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-lower-grid">
        {/* Industry distribution chart */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-50">客户行业分布分布</h3>
          <div className="h-52">
            {industryData.length > 0 ? (
              <SafeResponsiveContainer>
                {(width, height) => (
                  <BarChart width={width} height={height} data={industryData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false} />
                  </BarChart>
                )}
              </SafeResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                暂无行业分布数据
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Tasks & urgent reminders list */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-800">紧急临近日程/待办</h3>
            <button 
              onClick={() => setActiveTab("todos")}
              className="text-xs text-sky-500 hover:text-sky-600 font-semibold flex items-center space-x-0.5"
            >
              <span>查看全部</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3 max-h-[220px] overflow-y-auto">
            {todos.filter(t => !t.isCompleted).slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-start space-x-3 p-3 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  task.priority === "high" ? "bg-rose-500" : task.priority === "medium" ? "bg-amber-500" : "bg-slate-400"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{task.title}</p>
                  {task.customerName && (
                    <span className="text-[10px] text-slate-400 flex items-center mt-1">
                      <Building2 className="w-3 h-3 mr-1" />
                      {task.customerName}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono font-medium text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded uppercase leading-none shrink-0 self-center">
                  截至: {task.dueDate.split("-").slice(1).join("/")}
                </span>
              </div>
            ))}
            {todos.filter(t => !t.isCompleted).length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <span>太棒了！今天没有任何未完待办。</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
